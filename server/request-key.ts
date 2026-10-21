/**
 * Idempotency key for the successor agent a handoff creates.
 *
 * An automatic failover is keyed by the failed turn, so a retry of the same failover reuses the key and Paseo returns
 * the agent it already created. A manual move has no turn id: keying it by a constant made every manual move after the
 * first on the same agent fail with `agent_request_key_conflict`, so each manual move is keyed by target and time.
 */
export function successorRequestKey(
  agentId: string,
  turnId: string | null | undefined,
  targetProvider: string,
  nowMs: number,
): string {
  return `continuity:${agentId}:${turnId ?? `manual-${targetProvider}-${nowMs}`}`;
}
