# PROBAHO (প্রবাহ) — Prompt Library & Prompt Engineering Specification
**Documentation Addendum v1.1 — Section C**  
*Team Red Terminal · International AI Builders Congress 2026 · IndustrySphere AI: Supply Chain Nexus*

---

## 1. Prompt Engineering Approach

1. **Role Prompting:** Defines the assistant as a specialized pharmaceutical supply-chain risk analyst or inventory decision-support assistant.
2. **Contextual Prompting:** Injects structured data (facility-level stock, batch expiry dates, demand forecasts, supplier lead times, weather risks, and currency conversion rates) rather than generic open-ended queries.
3. **Structured-Output Prompting:** Enforces strict, machine-readable JSON schemas so outputs can be validated and parsed deterministically.
4. **Constraints and Grounding:** 
   - Prohibits hallucination or fabrication of numbers.
   - Enforces the hard rule: **"Active Pharmaceutical Ingredient" is always spelled out in full**.
   - Requires every numeric claim to be grounded in upstream tool outputs.
5. **Prompt-Injection Defense:** Treats user inputs and external document contents strictly as quoted *data*, never as executable instructions.
6. **No Autonomous Actions:** The LLM only explains and drafts recommendations; it cannot calculate quantities, approve transactions, or execute inventory transfers.

---

## 2. Standardized Prompts

### C1. Pharmaceutical Supply Chain Risk Detection
- **Identifier:** `C1`
- **Category:** `Data Processing`
- **Title:** `PROBAHO — Pharmaceutical Supply Chain Risk Detection`
- **Target Schema:** `C1RiskAssessment` (`risk_level`, `affected_medicines`, `identified_issues`, `supporting_evidence`, `recommendations`)

#### Prompt Text:
```text
Act as a pharmaceutical supply-chain risk analyst. Analyze only the supplied medicine inventory, shipment status, supplier details, delivery schedules, and clinic demand. Identify potential medicine shortages and shipment disruptions; classify risks as Low, Medium, High, or Critical; explain the supporting factors; and recommend practical mitigation options. Prioritize essential medicine availability. Do not invent missing information. Clearly label uncertainty. Return valid JSON with risk_level, affected_medicines, identified_issues, supporting_evidence, and recommendations.
```

---

### C2. Intelligent Inventory Recommendation
- **Identifier:** `C2`
- **Category:** `Feature Generation`
- **Title:** `PROBAHO — Intelligent Inventory Recommendation`
- **Target Schema:** `C2InventoryResponse` (`recommendations: List[C2InventoryItem]`)

#### Prompt Text:
```text
Act as an inventory decision-support assistant. Using the supplied stock, batch expiry, historical consumption, forecast, facility capacity, and supplier information, identify items that may need replenishment, low-stock risks, potential overstock, and expiry exposure. Recommend reorder priorities and explain the evidence. Do not fabricate demand forecasts or stock values. Distinguish observed data from estimates. Return valid JSON with medicine_name, facility, current_stock, risk_status, reorder_priority, evidence, and recommendations.
```

---

### C3. AI Output Quality Validation
- **Identifier:** `C3`
- **Category:** `Testing & Quality Assurance`
- **Title:** `PROBAHO — AI Recommendation Quality Validator`
- **Target Schema:** `C3QualityValidation` (`validation_status`, `accuracy_issues`, `unsupported_claims`, `missing_information`, `schema_validity`, `improvement_suggestions`)

#### Prompt Text:
```text
Act as a quality-assurance reviewer. Compare the AI-generated supply-chain assessment with the original input and trusted backend result. Check whether claims are supported, risk classifications are consistent, required issues are covered, numbers match the source data, and the response follows the required JSON schema. Flag unsupported claims, missing information, and invalid fields. Do not add new facts. Return valid JSON with validation_status, accuracy_issues, unsupported_claims, missing_information, schema_validity, and improvement_suggestions.
```

---

## 3. Runtime API Surface

| Endpoint | Method | Role |
|---|---|---|
| `/ai/copilot/prompts` | `GET` | Returns full prompt library catalog with categories and schemas |
| `/ai/copilot/prompts/execute` | `POST` | Executes a prompt with input data, validating numerical claims |
| `/api/copilot/prompts` | `GET` | Node.js gateway proxy for the prompt catalog |
| `/api/copilot/prompts/execute` | `POST` | Authenticated gateway execution endpoint |

