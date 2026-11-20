import crypto from 'crypto';

/**
 * Deterministic canonical JSON serialization
 * Ensures keys are sorted alphabetically at all nesting levels
 */
export function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Hash function for tamper-evident audit chaining:
 * event_hash = SHA256(previous_hash + canonical_json(event))
 */
export function computeEventHash(previousHash, eventData) {
  const content = previousHash + canonicalJson(eventData);
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * In-memory / persistent audit chain implementation
 */
class AuditChain {
  constructor() {
    this.chain = [];
    this.genesisHash = '0'.repeat(64);
  }

  append(eventType, actorName, actorRole, payload) {
    const previousHash = this.chain.length === 0 
      ? this.genesisHash 
      : this.chain[this.chain.length - 1].event_hash;

    const eventRecord = {
      sequence_number: this.chain.length + 1,
      event_type: eventType,
      actor_name: actorName,
      actor_role: actorRole,
      payload: payload,
      timestamp: new Date().toISOString()
    };

    const eventHash = computeEventHash(previousHash, eventRecord);

    const fullRecord = {
      ...eventRecord,
      previous_hash: previousHash,
      event_hash: eventHash
    };

    this.chain.push(fullRecord);
    return fullRecord;
  }

  getLogs() {
    return [...this.chain];
  }

  /**
   * Verifies the chain integrity.
   * Returns { valid: true } or { valid: false, broken_at_index, expected_hash, actual_hash }
   */
  verify() {
    for (let i = 0; i < this.chain.length; i++) {
      const entry = this.chain[i];
      const expectedPrevHash = (i === 0) ? this.genesisHash : this.chain[i - 1].event_hash;

      if (entry.previous_hash !== expectedPrevHash) {
        return {
          valid: false,
          broken_at_index: i,
          reason: `Previous hash mismatch at sequence ${entry.sequence_number}`,
          expected_prev_hash: expectedPrevHash,
          actual_prev_hash: entry.previous_hash
        };
      }

      // Recompute hash
      const eventData = {
        sequence_number: entry.sequence_number,
        event_type: entry.event_type,
        actor_name: entry.actor_name,
        actor_role: entry.actor_role,
        payload: entry.payload,
        timestamp: entry.timestamp
      };

      const recomputedHash = computeEventHash(entry.previous_hash, eventData);
      if (recomputedHash !== entry.event_hash) {
        return {
          valid: false,
          broken_at_index: i,
          reason: `Tamper detected at sequence ${entry.sequence_number}`,
          expected_hash: recomputedHash,
          actual_hash: entry.event_hash
        };
      }
    }

    return {
      valid: true,
      total_events: this.chain.length,
      head_hash: this.chain.length > 0 ? this.chain[this.chain.length - 1].event_hash : this.genesisHash
    };
  }
}

export const auditChainInstance = new AuditChain();
export const auditChain = auditChainInstance;
export default auditChainInstance;

