import { describe, expect, it } from "vitest";
import { successorRequestKey } from "./request-key";

describe("successorRequestKey", () => {
  it("keys an automatic failover by its turn, so a retry reuses the key", () => {
    expect(successorRequestKey("agent-1", "turn-7", "claude", 1000)).toBe(
      successorRequestKey("agent-1", "turn-7", "codex", 2000),
    );
  });

  it("gives each manual move its own key, so a second move is not rejected as a duplicate", () => {
    const first = successorRequestKey("agent-1", null, "claude", 1000);
    const second = successorRequestKey("agent-1", null, "claude", 2000);
    expect(second).not.toBe(first);
  });

  it("gives manual moves to different providers different keys", () => {
    expect(successorRequestKey("agent-1", undefined, "claude", 1000)).not.toBe(
      successorRequestKey("agent-1", undefined, "codex", 1000),
    );
  });

  it("never collides between agents", () => {
    expect(successorRequestKey("agent-1", null, "claude", 1000)).not.toBe(
      successorRequestKey("agent-2", null, "claude", 1000),
    );
  });
});
