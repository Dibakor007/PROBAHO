"""
Tests for seed data generator reproducibility.

Running with seed=42 must produce bit-identical output every time.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from seed.generator import generate_all


def test_reproducibility_seed_42():
    """Two independent generate_all(seed=42) calls produce identical JSON."""
    with tempfile.TemporaryDirectory() as tmp1, tempfile.TemporaryDirectory() as tmp2:
        d1 = generate_all(seed=42, data_dir=Path(tmp1))
        d2 = generate_all(seed=42, data_dir=Path(tmp2))

        datasets = ["facilities", "medicines", "batches", "consumption", "routes", "safety_stock"]
        for name in datasets:
            j1 = json.dumps(d1[name], sort_keys=True, ensure_ascii=False)
            j2 = json.dumps(d2[name], sort_keys=True, ensure_ascii=False)
            assert j1 == j2, f"Mismatch in {name}"


def test_files_written():
    """generate_all writes the expected six JSON files."""
    with tempfile.TemporaryDirectory() as tmp:
        generate_all(seed=42, data_dir=Path(tmp))
        expected = [
            "facilities.json",
            "medicines.json",
            "batches.json",
            "consumption.json",
            "routes.json",
            "safety_stock.json",
        ]
        for fname in expected:
            p = Path(tmp) / fname
            assert p.exists(), f"Missing file: {fname}"
            data = json.loads(p.read_text(encoding="utf-8"))
            assert isinstance(data, list), f"{fname} should contain a JSON array"
            assert len(data) > 0, f"{fname} should not be empty"


def test_facility_count():
    """Should produce 9 nodes total: 1 supplier + 1 manufacturer + 1 warehouse + 6 facilities."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        assert len(d["facilities"]) == 9


def test_medicine_count():
    """Should produce exactly 5 medicines."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        assert len(d["medicines"]) == 5


def test_consumption_record_count():
    """6 facilities × 5 medicines × 365 days = 10 950 records."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        assert len(d["consumption"]) == 6 * 5 * 365


def test_consumption_non_negative():
    """Every consumption quantity must be >= 0."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        for rec in d["consumption"]:
            assert rec["quantity"] >= 0, f"Negative consumption: {rec}"


def test_batches_per_facility_medicine():
    """Each (facility, medicine) pair should have 3-5 batches."""
    from collections import Counter
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        counts = Counter(
            (b["facility_id"], b["medicine_id"]) for b in d["batches"]
        )
        facility_ids = [f"FAC-{i:03d}" for i in range(1, 7)]
        medicine_ids = [f"MED-{i:03d}" for i in range(1, 6)]
        for fid in facility_ids:
            for mid in medicine_ids:
                n = counts[(fid, mid)]
                assert 3 <= n <= 5, f"({fid}, {mid}) has {n} batches, expected 3-5"


def test_safety_stock_values():
    """Safety stock should be 14 × average daily consumption."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        for ss in d["safety_stock"]:
            expected = round(ss["average_daily_consumption"] * 14, 2)
            assert ss["safety_stock_quantity"] == expected, (
                f"Safety stock mismatch for {ss['facility_id']}/{ss['medicine_id']}: "
                f"got {ss['safety_stock_quantity']}, expected {expected}"
            )
            assert ss["safety_stock_days"] == 14


def test_routes_cover_all_facilities():
    """Every facility must be reachable from the warehouse."""
    with tempfile.TemporaryDirectory() as tmp:
        d = generate_all(seed=42, data_dir=Path(tmp))
        destinations = {r["to_id"] for r in d["routes"] if r["from_id"] == "WH-001"}
        facility_ids = {f"FAC-{i:03d}" for i in range(1, 7)}
        assert facility_ids.issubset(destinations), (
            f"Missing routes to: {facility_ids - destinations}"
        )


def test_different_seed_different_output():
    """A different seed should produce different batches."""
    with tempfile.TemporaryDirectory() as tmp1, tempfile.TemporaryDirectory() as tmp2:
        d1 = generate_all(seed=42, data_dir=Path(tmp1))
        d2 = generate_all(seed=99, data_dir=Path(tmp2))
        j1 = json.dumps(d1["batches"], sort_keys=True)
        j2 = json.dumps(d2["batches"], sort_keys=True)
        assert j1 != j2, "Different seeds should produce different data"
