"""
Run forecasting evaluation across all models, medicines, and facilities.

Usage:
    cd ai-service
    python -m scripts.run_evaluation

Loads seed data via seed.generator.load_data(), runs rolling-origin
cross-validation for every model/medicine/facility combination, saves
results to evaluation/report.json, and prints a summary table.
"""

import json
import os
import sys

# Ensure ai-service is on the path so local packages resolve
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(SCRIPT_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from seed.generator import load_data
from forecasting.evaluation import evaluate_all_models


def main() -> None:
    # ---- Load seed data ----
    print("Loading seed data...")
    data = load_data()

    consumption = data["consumption"]
    medicines = data["medicines"]
    facilities = data["facilities"]

    print(
        f"  {len(consumption)} consumption records, "
        f"{len(medicines)} medicines, "
        f"{len(facilities)} facilities"
    )

    # ---- Run evaluation ----
    print("\nRunning forecasting evaluation (rolling-origin CV)...")
    report = evaluate_all_models(consumption, medicines, facilities)

    # ---- Save report ----
    eval_dir = os.path.join(SERVICE_DIR, "evaluation")
    os.makedirs(eval_dir, exist_ok=True)
    report_path = os.path.join(eval_dir, "report.json")

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nReport saved to {report_path}")

    # ---- Print summary table ----
    print("\n" + "=" * 90)
    print("FORECASTING EVALUATION SUMMARY")
    print("=" * 90)
    print(
        f"{'Facility':<16} {'Medicine':<16} {'Model':<24} "
        f"{'MAE':>8} {'RMSE':>8} {'WAPE':>8} {'Folds':>6}"
    )
    print("-" * 90)

    for entry in report["results"]:
        fac = entry["facility_id"][:14]
        med = entry["medicine_id"][:14]
        model = entry["model"]
        mae = f"{entry['avg_mae']:.2f}" if entry["avg_mae"] is not None else "N/A"
        rmse = f"{entry['avg_rmse']:.2f}" if entry["avg_rmse"] is not None else "N/A"
        wape = f"{entry['avg_wape']:.2%}" if entry["avg_wape"] is not None else "N/A"
        folds = str(len(entry["cv_folds"]))

        print(f"{fac:<16} {med:<16} {model:<24} {mae:>8} {rmse:>8} {wape:>8} {folds:>6}")

    # ---- Print best models ----
    print("\n" + "=" * 60)
    print("BEST MODEL BY MEDICINE (lowest avg MAE)")
    print("-" * 60)
    for med_id, model in report["summary"]["best_model_by_medicine"].items():
        print(f"  {med_id:<30} → {model}")

    print("\nBEST MODEL BY FACILITY (lowest avg MAE)")
    print("-" * 60)
    for fac_id, model in report["summary"]["best_model_by_facility"].items():
        print(f"  {fac_id:<30} → {model}")

    print("\n✓ Evaluation complete.")


if __name__ == "__main__":
    main()
