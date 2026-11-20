"""
Tests for the copilot module.

Covers:
- _validate_response rejects hallucinated numbers
- _validate_response accepts grounded numbers
- _fallback_response returns non-empty string
- copilot_query with no API key returns fallback
"""

from __future__ import annotations

import json
import os

import pytest

from copilot.engine import _validate_response, _fallback_response, copilot_query


# ------------------------------------------------------------------
# _validate_response
# ------------------------------------------------------------------

class TestValidateResponse:
    """Validation of LLM-generated numbers against tool outputs."""

    def test_rejects_hallucinated_number(self) -> None:
        """A number not present in tool output must cause rejection."""
        tool_json = json.dumps({"stock": 100, "forecast": 25.5})
        response = "The facility has 100 units and a forecast of 99.9 per day."
        # 99.9 is NOT in tool_json
        assert _validate_response(response, tool_json) is False

    def test_accepts_grounded_numbers(self) -> None:
        """All numbers in the response appear in tool output → accept."""
        tool_json = json.dumps({"stock": 100, "forecast": 25.5, "days": 3})
        response = "Stock is 100, daily forecast 25.5, days of cover 3."
        assert _validate_response(response, tool_json) is True

    def test_no_numbers_is_valid(self) -> None:
        """A response with no numbers at all passes validation."""
        tool_json = json.dumps({"status": "ok"})
        response = "Everything looks fine."
        assert _validate_response(response, tool_json) is True


# ------------------------------------------------------------------
# _fallback_response
# ------------------------------------------------------------------

class TestFallbackResponse:
    """Deterministic template fallback."""

    def test_returns_nonempty_english(self) -> None:
        result = _fallback_response(
            question="What is the stock?",
            tool_outputs={"inventory": {"stock": 42}},
            language="en",
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_returns_nonempty_bangla(self) -> None:
        result = _fallback_response(
            question="মজুদ কত?",
            tool_outputs={"inventory": {"stock": 42}},
            language="bn",
        )
        assert isinstance(result, str)
        assert len(result) > 0
        assert "সরবরাহ" in result  # Bangla header present


# ------------------------------------------------------------------
# copilot_query (no API key)
# ------------------------------------------------------------------

class TestCopilotQueryNoKey:
    """With no GEMINI_API_KEY the copilot must return a fallback."""

    @pytest.mark.asyncio
    async def test_no_api_key_returns_fallback(self) -> None:
        # Ensure no key is set
        env = os.environ.copy()
        os.environ.pop("GEMINI_API_KEY", None)
        try:
            result = await copilot_query(
                question="How is stock?",
                language="en",
                data={},
                context_tools={"inventory": {"stock": 200, "days_of_cover": 14}},
            )
            assert isinstance(result, str)
            assert len(result) > 0
            # Should contain the tool name from fallback formatting
            assert "inventory" in result.lower()
        finally:
            os.environ.clear()
            os.environ.update(env)


# ------------------------------------------------------------------
# Prompt Library (C1, C2, C3)
# ------------------------------------------------------------------

class TestPromptLibrary:
    """Tests for Standardized Prompts C1, C2, C3 from Documentation Addendum v1.1."""

    def test_prompt_catalog_integrity(self) -> None:
        from app.copilot.prompts import PROMPT_CATALOG
        assert len(PROMPT_CATALOG) == 3
        ids = [p["id"] for p in PROMPT_CATALOG]
        assert "C1" in ids
        assert "C2" in ids
        assert "C3" in ids
        for p in PROMPT_CATALOG:
            assert "category" in p
            assert "title" in p
            assert "prompt_text" in p
            assert len(p["prompt_text"]) > 50

    def test_execute_c1_risk_detection(self) -> None:
        from app.copilot.prompts import execute_prompt
        res = execute_prompt("C1", {"affected_medicines": ["Paracetamol 500mg"], "shipment_delay_days": 14})
        assert res["prompt_id"] == "C1"
        assert res["assessment"]["risk_level"] == "Critical"
        assert len(res["assessment"]["identified_issues"]) > 0
        assert len(res["assessment"]["recommendations"]) > 0

    def test_execute_c2_inventory_recommendation(self) -> None:
        from app.copilot.prompts import execute_prompt
        res = execute_prompt("C2", {})
        assert res["prompt_id"] == "C2"
        assert len(res["recommendations"]) >= 2
        for item in res["recommendations"]:
            assert "medicine_name" in item
            assert "current_stock" in item
            assert "risk_status" in item

    def test_execute_c3_quality_validation(self) -> None:
        from app.copilot.prompts import execute_prompt
        res = execute_prompt("C3", {
            "ai_assessment": {"stock": 100, "unverified": 999},
            "trusted_backend_result": {"stock": 100}
        })
        assert res["prompt_id"] == "C3"
        assert res["validation_report"]["schema_validity"] is True
        assert res["validation_report"]["validation_status"] in ("PASSED", "WARNING")

