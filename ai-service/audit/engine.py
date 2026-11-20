"""
Hash-chained audit log for pharmaceutical supply chain decisions.

Every event is linked to its predecessor via SHA-256 hashing, creating a
tamper-evident chain.  Any modification to a past event breaks the chain and
is detected by ``verify_chain``.

NOTE: "Active Pharmaceutical Ingredient" is always written in full.
      "API" refers only to software REST APIs in this codebase.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class AuditLog:
    """Append-only, hash-chained audit log."""

    def __init__(self) -> None:
        """Initialise with a genesis block (previous_hash = 64 zeros)."""
        self._events: list[dict[str, Any]] = []
        self._previous_hash: str = "0" * 64

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_hash(previous_hash: str, event_data: dict[str, Any]) -> str:
        """SHA-256(previous_hash + canonical_json(event_data))."""
        canonical = json.dumps(event_data, sort_keys=True, separators=(",", ":"))
        payload = previous_hash + canonical
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def log_event(
        self,
        event_type: str,
        details: dict[str, Any],
        user_name: str | None = None,
    ) -> dict[str, Any]:
        """Append an event to the chain and return it."""
        event_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "details": details,
            "user_name": user_name,
        }
        event_hash = self._compute_hash(self._previous_hash, event_data)
        event_record: dict[str, Any] = {
            **event_data,
            "previous_hash": self._previous_hash,
            "hash": event_hash,
        }
        self._events.append(event_record)
        self._previous_hash = event_hash
        return event_record

    def approve(
        self,
        recommendation_id: str,
        user_name: str,
        reason: str,
    ) -> dict[str, Any]:
        """Log an approval event for a recommendation."""
        return self.log_event(
            event_type="approval",
            details={
                "recommendation_id": recommendation_id,
                "action": "approved",
                "reason": reason,
            },
            user_name=user_name,
        )

    def reject(
        self,
        recommendation_id: str,
        user_name: str,
        reason: str,
    ) -> dict[str, Any]:
        """Log a rejection event for a recommendation."""
        return self.log_event(
            event_type="rejection",
            details={
                "recommendation_id": recommendation_id,
                "action": "rejected",
                "reason": reason,
            },
            user_name=user_name,
        )

    def get_events(self) -> list[dict[str, Any]]:
        """Return all events in chain order."""
        return list(self._events)

    def verify_chain(self) -> dict[str, Any]:
        """Walk the chain and verify every hash link.

        Returns
        -------
        dict  with keys *valid* (bool), *broken_at* (int | None), and
              *total_events* (int).
        """
        previous_hash = "0" * 64
        for idx, event in enumerate(self._events):
            event_data = {
                "timestamp": event["timestamp"],
                "event_type": event["event_type"],
                "details": event["details"],
                "user_name": event["user_name"],
            }
            expected = self._compute_hash(previous_hash, event_data)
            if expected != event["hash"]:
                return {
                    "valid": False,
                    "broken_at": idx,
                    "total_events": len(self._events),
                }
            if event["previous_hash"] != previous_hash:
                return {
                    "valid": False,
                    "broken_at": idx,
                    "total_events": len(self._events),
                }
            previous_hash = event["hash"]

        return {
            "valid": True,
            "broken_at": None,
            "total_events": len(self._events),
        }

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str | Path) -> None:
        """Persist the event chain to a JSON file."""
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(self._events, fh, indent=2, ensure_ascii=False)

    @classmethod
    def load(cls, path: str | Path) -> "AuditLog":
        """Restore an AuditLog from a previously saved JSON file."""
        path = Path(path)
        with open(path, "r", encoding="utf-8") as fh:
            events = json.load(fh)

        log = cls()
        log._events = events
        if events:
            log._previous_hash = events[-1]["hash"]
        return log
