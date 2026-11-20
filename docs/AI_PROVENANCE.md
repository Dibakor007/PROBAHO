# AI Provenance — PROBAHO (প্রবাহ)

This document lists every AI model, machine-learning library, and intelligent component used in PROBAHO, what role each plays, and what each does **not** do.

---

## Models and Libraries

### 1. statsmodels

- **Version:** 0.14.x
- **Component used:** `ExponentialSmoothing` (Holt-Winters additive seasonal model)
- **Role:** Primary demand-forecasting model. Fits level, trend, and seasonal components on historical daily consumption data. Parameters (α, β, γ) are optimised via maximum likelihood.
- **What it does:** Produces point forecasts and confidence intervals for medicine consumption per facility.
- **What it does NOT do:** It does not make procurement decisions, approve transfers, or interact with users.

### 2. scikit-learn

- **Version:** 1.4.x
- **Component used:** Utility functions for metric computation; potential future use for gradient-boosting features (P1).
- **Role:** Supporting library for MAE/RMSE computation and data preprocessing.
- **What it does:** Computes evaluation metrics.
- **What it does NOT do:** No model in scikit-learn makes autonomous decisions in the P0 build.

### 3. Google OR-Tools

- **Version:** 9.9+
- **Component used:** CP-SAT solver / linear solver
- **Role:** Redistribution optimisation. Finds the minimum-cost set of inter-facility transfers subject to safety-stock, capacity, shelf-life, and route constraints.
- **What it does:** Produces a recommended transfer plan with objective value and constraint satisfaction proof.
- **What it does NOT do:** It does not execute transfers. All recommendations require explicit human approval through the audit trail.

### 4. Gemini (via `google-generativeai`)

- **Version:** Latest available via the Python SDK
- **Model:** Configurable via `GEMINI_MODEL` environment variable (default: `gemini-2.0-flash`)
- **Role:** Explanation generation only. The copilot sends structured data (forecasts, simulation results, optimisation outputs) to Gemini and receives a natural-language explanation.
- **What it does:** Translates structured numerical outputs into plain-language summaries in Bangla or English.
- **What it does NOT do:**
  - ❌ **Never calculates** — all numbers originate from the backend tools listed above.
  - ❌ **Never approves or rejects** — all decisions go through the audit trail with human sign-off.
  - ❌ **Never executes** — the LLM has no access to any system action.
  - ❌ **Never runs on the client** — all Gemini calls are server-side; the API key is never exposed to the browser.
- **Fallback:** If `GEMINI_API_KEY` is not set or the Gemini service is unavailable, the copilot uses deterministic template-based responses with no loss of core functionality.
- **Validation:** Every number in the LLM's response is checked against the structured source data. If any number cannot be traced to the tool output, the response is replaced with the template fallback.

### 5. NumPy / pandas

- **Role:** Data generation, manipulation, and numerical computation throughout the pipeline.
- **What they do:** Array operations, data loading, aggregation, date arithmetic.
- **What they do NOT do:** No autonomous decisions.

---

## Summary Table

| Library / Model | Role | Autonomous Decisions? | Runs on Client? |
|----------------|------|----------------------|-----------------|
| statsmodels (Holt-Winters) | Demand forecasting | No | No |
| scikit-learn | Metrics, preprocessing | No | No |
| Google OR-Tools | Redistribution optimisation | No — requires human approval | No |
| Gemini (google-generativeai) | Explanation generation only | No — explain only, never calculate/approve/execute | No |
| NumPy / pandas | Data processing | No | No |

---

## Responsible AI Notes

1. **Human-in-the-loop:** Every optimiser recommendation must be explicitly approved or rejected by a named user, with a reason, through the hash-chained audit trail.
2. **Transparency:** The evaluation pipeline reports forecast accuracy metrics openly. The copilot cites the source tool and data for every explanation.
3. **No patient data:** The system processes logistics data only — medicine quantities, facility locations, consumption volumes. No personally identifiable or clinical information is handled.
4. **Synthetic data:** All data in the P0 build is generated synthetically with a fixed random seed (42). It does not represent real supply chain conditions or any government data.
5. **Bias awareness:** Forecasting models are trained on synthetic data with engineered seasonality. Real-world deployment would require validation on actual consumption patterns, which may exhibit biases not present in synthetic data.
