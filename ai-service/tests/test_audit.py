"""
Tests for the hash-chained audit log.

Covers:
- Normal chain verifies as valid
- Tampering with a past event is detected by verify_chain
- approve / reject create proper events
"""

from __future__ import annotations

import copy
import tempfile
from pathlib import Path

import pytest

from audit.engine import AuditLog


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _populated_log() -> AuditLog:
    """Return an AuditLog with a handful of mixed events."""
    log = AuditLog()
    log.log_event("transfer", {"from": "F1", "to": "F2", "qty": 100})
    log.log_event("alert", {"medicine": "Paracetamol", "level": "low"})
    log.approve("rec-001", "Dr. Karim", "Looks good")
    log.reject("rec-002", "Dr. Nusrat", "Insufficient evidence")
    return log


# ------------------------------------------------------------------
# Tests
# ------------------------------------------------------------------

class TestChainIntegrity:
    """Chain integrity verification."""

    def test_valid_chain(self) -> None:
        """A freshly built chain must verify as valid."""
        log = _populated_log()
        result = log.verify_chain()
        assert result["valid"] is True
        assert result["broken_at"] is None
        assert result["total_events"] == 4

    def test_tampered_details_detected(self) -> None:
        """Modifying a past event's details must be caught by verify_chain."""
        log = _populated_log()
        # Tamper with the second event's details
        log._events[1]["details"]["level"] = "critical"
        result = log.verify_chain()
        assert result["valid"] is False
        assert result["broken_at"] == 1

    def test_tampered_first_event_detected(self) -> None:
        """Tampering with the very first event should break the chain at index 0."""
        log = _populated_log()
        log._events[0]["details"]["qty"] = 999
        result = log.verify_chain()
        assert result["valid"] is False
        assert result["broken_at"] == 0

    def test_empty_log_valid(self) -> None:
        """An empty log (no events) is trivially valid."""
        log = AuditLog()
        result = log.verify_chain()
        assert result["valid"] is True
        assert result["broken_at"] is None
        assert result["total_events"] == 0


class TestApproveReject:
    """Approve and reject convenience methods."""

    def test_approve_creates_event(self) -> None:
        log = AuditLog()
        event = log.approve("rec-100", "admin", "Budget approved")
        assert event["event_type"] == "approval"
        assert event["details"]["recommendation_id"] == "rec-100"
        assert event["details"]["action"] == "approved"
        assert event["details"]["reason"] == "Budget approved"
        assert event["user_name"] == "admin"
        assert "hash" in event

    def test_reject_creates_event(self) -> None:
        log = AuditLog()
        event = log.reject("rec-200", "reviewer", "Too risky")
        assert event["event_type"] == "rejection"
        assert event["details"]["recommendation_id"] == "rec-200"
        assert event["details"]["action"] == "rejected"
        assert event["details"]["reason"] == "Too risky"
        assert event["user_name"] == "reviewer"
        assert "hash" in event

    def test_chain_valid_after_approve_reject(self) -> None:
        log = AuditLog()
        log.approve("rec-1", "u1", "ok")
        log.reject("rec-2", "u2", "no")
        log.approve("rec-3", "u3", "fine")
        result = log.verify_chain()
        assert result["valid"] is True
        assert result["total_events"] == 3


class TestPersistence:
    """save / load round-trip."""

    def test_save_load_roundtrip(self) -> None:
        log = _populated_log()
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "audit.json"
            log.save(path)
            loaded = AuditLog.load(path)
        assert loaded.get_events() == log.get_events()
        assert loaded.verify_chain()["valid"] is True

    def test_loaded_log_can_append(self) -> None:
        """After loading, new events should chain correctly."""
        log = _populated_log()
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "audit.json"
            log.save(path)
            loaded = AuditLog.load(path)
        loaded.log_event("restock", {"medicine": "ORS", "qty": 500})
        result = loaded.verify_chain()
        assert result["valid"] is True
        assert result["total_events"] == 5
