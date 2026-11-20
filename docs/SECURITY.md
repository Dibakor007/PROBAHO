# PROBAHO (প্রবাহ) — Security, Privacy & Guardrails

## 1. Threat Model & Mitigations

| Threat | Risk | PROBAHO Mitigation |
|---|---|---|
| **Unauthorized Action** | Non-approver authorizes medicine shipments | Enforced server-side Role-Based Access Control (`403 Forbidden` on privilege violation). |
| **Audit Log Tampering** | Actor modifies past records or stock counts | Append-only SHA-256 hash chaining. Single-click verification recomputes all hashes. |
| **Prompt Injection** | User crafts prompts instructing LLM to fabricate data or execute orders | User inputs are treated strictly as read-only data, never as executable instructions. |
| **LLM Arithmetic Hallucination** | LLM outputs incorrect quantities or stock days | LLM generates explanations only. All numbers must strictly match deterministic tool outputs, else fallback is triggered. |
| **Credential Leakage** | API keys or database secrets exposed to client | All secrets live server-side in `.env`. Browser never receives backend or LLM credentials. |
| **Patient Privacy Violation** | Exposure of personal medical information | PROBAHO operates solely at aggregate inventory and batch counts. Zero patient data is ingested or stored. |

## 2. Cryptographic Audit Chain Specification
```
event_hash = SHA256(previous_hash + canonical_json(event))
```
- `canonical_json` recursively sorts all object keys alphabetically and strips non-deterministic whitespace.
- Genesis block starts with 64 zero characters (`0000...0000`).
- Any mutation of past events cascades a cryptographic failure detected by `/api/audit/verify`.

