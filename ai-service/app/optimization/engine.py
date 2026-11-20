"""
Redistribution optimizer for pharmaceutical supply chain.

Uses OR-Tools CP-SAT solver to find optimal medicine transfers between
facilities, minimizing transport cost, unmet demand, expiry waste, and
transfer complexity while respecting safety stock, capacity, and shelf-life
constraints.

NOTE: "Active Pharmaceutical Ingredient" is always written in full.
      "API" refers only to software REST APIs in this codebase.
"""

from __future__ import annotations

import datetime
from typing import Any

from ortools.sat.python import cp_model


def optimize_redistribution(
    data: dict[str, Any],
    inventory_status: list[dict[str, Any]],
    reference_date: str = "2025-07-15",
) -> dict[str, Any]:
    """Run the redistribution optimiser over current inventory state.

    Parameters
    ----------
    data : dict
        Seed data dictionary containing *facilities*, *medicines*, *batches*,
        *routes*, and *safety_stock*.
    inventory_status : list[dict]
        Each entry has facility_id, medicine_id, days_of_cover,
        usable_stock, and forecast_daily (from the inventory module).
    reference_date : str
        ISO-format date used as "today" for expiry and lead-time checks.

    Returns
    -------
    dict  with keys: transfers, total_cost, days_of_cover_before,
          days_of_cover_after, min_days_of_cover, spread_days_of_cover,
          solver_status.
    """

    ref_date = datetime.date.fromisoformat(reference_date)

    # ------------------------------------------------------------------
    # Unpack seed data
    # ------------------------------------------------------------------
    facilities = data.get("facilities", [])
    medicines = data.get("medicines", [])
    batches = data.get("batches", [])
    routes = data.get("routes", [])
    safety_stock_list = data.get("safety_stock", [])

    facility_ids = [f.get("facility_id") or f.get("id") for f in facilities]
    medicine_ids = [m.get("medicine_id") or m.get("id") for m in medicines]

    fac_idx = {fid: i for i, fid in enumerate(facility_ids)}
    med_idx = {mid: i for i, mid in enumerate(medicine_ids)}

    n_fac = len(facility_ids)
    n_med = len(medicine_ids)

    # ------------------------------------------------------------------
    # Build lookup tables
    # ------------------------------------------------------------------

    # Stock per (facility, medicine)
    stock: dict[tuple[str, str], int] = {}
    forecast_daily: dict[tuple[str, str], float] = {}
    for entry in inventory_status:
        key = (entry["facility_id"], entry["medicine_id"])
        stock[key] = int(entry.get("usable_stock", 0))
        forecast_daily[key] = float(entry.get("forecast_daily", 0.0))

    # Safety stock per (facility, medicine)
    safety: dict[tuple[str, str], int] = {}
    for ss in safety_stock_list:
        key = (ss["facility_id"], ss["medicine_id"])
        safety[key] = int(ss.get("safety_stock", 0))

    # Facility capacity
    capacity: dict[str, int] = {}
    for f in facilities:
        fid = f.get("facility_id") or f.get("id")
        capacity[fid] = int(f.get("capacity", 10_000))

    # Routes: (from, to) -> {cost, lead_time}
    route_map: dict[tuple[str, str], dict] = {}
    for r in routes:
        route_map[(r["from_id"], r["to_id"])] = {
            "cost": float(r.get("cost_per_unit", 0.0)),
            "lead_time": int(r.get("lead_time_days", 1)),
        }

    # Determine which (from, to, med) triples are feasible considering
    # batch shelf-life: at least one usable batch must have expiry >=
    # lead_time + 7 days from reference_date.
    batch_ok: dict[tuple[str, str, str], bool] = {}
    for fi in facility_ids:
        for fj in facility_ids:
            if fi == fj:
                continue
            if (fi, fj) not in route_map:
                continue
            lt = route_map[(fi, fj)]["lead_time"]
            min_expiry = ref_date + datetime.timedelta(days=lt + 7)
            for mid in medicine_ids:
                # Check if any batch at fi for mid has sufficient shelf life
                has_valid_batch = False
                for b in batches:
                    if b.get("facility_id") == fi and b.get("medicine_id") == mid:
                        exp = datetime.date.fromisoformat(b["expiry_date"])
                        if exp >= min_expiry:
                            has_valid_batch = True
                            break
                batch_ok[(fi, fj, mid)] = has_valid_batch

    # Compute expiry waste units per (facility, medicine): batches that will
    # expire before they can be consumed or transferred.
    waste_units: dict[tuple[str, str], int] = {}
    for fi in facility_ids:
        for mid in medicine_ids:
            # Batches at this facility for this medicine expiring within 7 days
            w = 0
            for b in batches:
                if b.get("facility_id") == fi and b.get("medicine_id") == mid:
                    exp = datetime.date.fromisoformat(b["expiry_date"])
                    if exp < ref_date + datetime.timedelta(days=7):
                        w += int(b.get("quantity", 0))
            waste_units[(fi, mid)] = w

    # ------------------------------------------------------------------
    # Upper bound for any single transfer variable
    # ------------------------------------------------------------------
    max_transfer = max(
        (stock.get((fi, mid), 0) for fi in facility_ids for mid in medicine_ids),
        default=0,
    )
    if max_transfer == 0:
        max_transfer = 1  # avoid zero domain

    # ------------------------------------------------------------------
    # CP-SAT model
    # ------------------------------------------------------------------
    model = cp_model.CpModel()

    # Decision variables: transfer[i][j][m]
    transfer = {}
    for fi in facility_ids:
        for fj in facility_ids:
            if fi == fj:
                continue
            if (fi, fj) not in route_map:
                continue
            for mid in medicine_ids:
                if not batch_ok.get((fi, fj, mid), False):
                    continue
                var_name = f"t_{fi}_{fj}_{mid}"
                transfer[(fi, fj, mid)] = model.new_int_var(
                    0, max_transfer, var_name
                )

    # Indicator variables for non-zero transfers (for transfer_count_penalty)
    is_nonzero = {}
    for key, var in transfer.items():
        ind = model.new_bool_var(f"nz_{key}")
        # var > 0 => ind = 1 ; var == 0 => ind = 0
        model.add(var >= 1).only_enforce_if(ind)
        model.add(var == 0).only_enforce_if(ind.negated())
        is_nonzero[key] = ind

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------

    # 1. Donor keeps at least safety_stock after all outgoing transfers
    for fi in facility_ids:
        for mid in medicine_ids:
            outgoing = [
                transfer[(fi, fj, mid)]
                for fj in facility_ids
                if (fi, fj, mid) in transfer
            ]
            if outgoing:
                s = stock.get((fi, mid), 0)
                ss = safety.get((fi, mid), 0)
                max_allowed = max(0, s - ss)
                model.add(sum(outgoing) <= max_allowed)

    # 2. Recipient capacity not exceeded
    for fj in facility_ids:
        total_stock_at_fj = sum(
            stock.get((fj, mid), 0) for mid in medicine_ids
        )
        net_in = []
        net_out = []
        for mid in medicine_ids:
            for fi in facility_ids:
                if (fi, fj, mid) in transfer:
                    net_in.append(transfer[(fi, fj, mid)])
                if (fj, fi, mid) in transfer:
                    net_out.append(transfer[(fj, fi, mid)])
        if net_in or net_out:
            model.add(
                total_stock_at_fj + sum(net_in) - sum(net_out)
                <= capacity.get(fj, 10_000)
            )

    # 3. transfer >= 0 is enforced by the variable domain (0..max_transfer)
    # 4. Route must exist — only created variables for existing routes

    # ------------------------------------------------------------------
    # Objective components (all scaled to integers for CP-SAT)
    # ------------------------------------------------------------------
    SCALE = 100  # scale float costs to int

    # a) Transport cost
    transport_cost_terms = []
    for (fi, fj, mid), var in transfer.items():
        cost = int(route_map[(fi, fj)]["cost"] * SCALE)
        transport_cost_terms.append(var * cost)

    # b) Unmet demand penalty
    # For each facility j and medicine m:
    #   penalty = 1000 * max(0, safety[j][m] - (stock[j][m] + net_in - net_out))
    # We model the slack as an auxiliary variable.
    UNMET_PENALTY = 1000 * SCALE
    unmet_vars = []
    for fj in facility_ids:
        for mid in medicine_ids:
            ss = safety.get((fj, mid), 0)
            s = stock.get((fj, mid), 0)
            incoming = [
                transfer[(fi, fj, mid)]
                for fi in facility_ids
                if (fi, fj, mid) in transfer
            ]
            outgoing = [
                transfer[(fj, fo, mid)]
                for fo in facility_ids
                if (fj, fo, mid) in transfer
            ]
            # unmet = max(0, ss - (s + net_transfers))
            # Let deficit_var >= 0 and deficit_var >= ss - s - net_in + net_out
            deficit = model.new_int_var(0, max(ss, max_transfer), f"def_{fj}_{mid}")
            expr = ss - s
            # deficit >= expr - sum(incoming) + sum(outgoing)
            model.add(deficit >= expr - sum(incoming) + sum(outgoing))
            unmet_vars.append(deficit * UNMET_PENALTY)

    # c) Expiry waste penalty: 500 * waste_units (constant per scenario but we
    #    reduce it when transfers move stock away before expiry).  For
    #    simplicity the constant waste is added; transfers from near-expiry
    #    stock are already blocked by the batch_ok filter.
    EXPIRY_PENALTY = 500 * SCALE
    total_waste = sum(waste_units.values())
    expiry_cost_constant = total_waste * EXPIRY_PENALTY

    # d) Transfer count penalty
    TRANSFER_COUNT_PENALTY = 10 * SCALE
    count_terms = [ind * TRANSFER_COUNT_PENALTY for ind in is_nonzero.values()]

    # Combine objective
    model.minimize(
        sum(transport_cost_terms)
        + sum(unmet_vars)
        + expiry_cost_constant
        + sum(count_terms)
    )

    # ------------------------------------------------------------------
    # Solve
    # ------------------------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.solve(model)

    status_name = solver.status_name(status)

    # ------------------------------------------------------------------
    # Extract solution
    # ------------------------------------------------------------------
    transfers_list: list[dict[str, Any]] = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (fi, fj, mid), var in transfer.items():
            qty = solver.value(var)
            if qty > 0:
                rt = route_map[(fi, fj)]
                transfers_list.append(
                    {
                        "from_id": fi,
                        "to_id": fj,
                        "medicine_id": mid,
                        "quantity": qty,
                        "cost": round(qty * rt["cost"], 2),
                        "route_lead_time": rt["lead_time"],
                    }
                )

    # Compute total cost
    total_cost = round(sum(t["cost"] for t in transfers_list), 2)

    # ------------------------------------------------------------------
    # Days-of-cover before / after
    # ------------------------------------------------------------------
    days_of_cover_before: dict[str, dict[str, float]] = {}
    days_of_cover_after: dict[str, dict[str, float]] = {}

    # Net transfer deltas per (facility, medicine)
    net_delta: dict[tuple[str, str], int] = {}
    for t in transfers_list:
        key_from = (t["from_id"], t["medicine_id"])
        key_to = (t["to_id"], t["medicine_id"])
        net_delta[key_from] = net_delta.get(key_from, 0) - t["quantity"]
        net_delta[key_to] = net_delta.get(key_to, 0) + t["quantity"]

    all_doc_values: list[float] = []
    for fi in facility_ids:
        days_of_cover_before[fi] = {}
        days_of_cover_after[fi] = {}
        for mid in medicine_ids:
            fd = forecast_daily.get((fi, mid), 0.0)
            s = stock.get((fi, mid), 0)
            doc_before = round(s / fd, 2) if fd > 0 else 999.0
            new_stock = s + net_delta.get((fi, mid), 0)
            doc_after = round(new_stock / fd, 2) if fd > 0 else 999.0
            days_of_cover_before[fi][mid] = doc_before
            days_of_cover_after[fi][mid] = doc_after
            if doc_after < 999.0:
                all_doc_values.append(doc_after)

    finite_docs = [v for v in all_doc_values if v < 999.0]
    min_doc = round(min(finite_docs), 2) if finite_docs else 0.0
    max_doc = max(finite_docs) if finite_docs else 0.0
    spread_doc = round(max_doc - min_doc, 2)

    return {
        "transfers": transfers_list,
        "total_cost": total_cost,
        "days_of_cover_before": days_of_cover_before,
        "days_of_cover_after": days_of_cover_after,
        "min_days_of_cover": min_doc,
        "spread_days_of_cover": spread_doc,
        "solver_status": status_name,
    }
