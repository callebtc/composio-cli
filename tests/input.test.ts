import { describe, expect, it } from "vitest";
import { buildActionInput } from "../src/input.js";
import type { ToolkitAction } from "../src/types.js";

const action: ToolkitAction = {
  slug: "GOOGLECALENDAR_FIND_EVENT",
  name: "Find Event",
  toolkitSlug: "googlecalendar",
  cliName: "find-event",
  aliases: ["find-event"],
  inputSchema: {
    type: "object",
    required: ["calendar_id", "query"],
    properties: {
      calendar_id: { type: "string" },
      query: { type: "string" },
      limit: { type: "integer" },
      include_cancelled: { type: "boolean" },
      filters: { type: "object" },
    },
  },
};

describe("buildActionInput", () => {
  it("maps kebab-case flags to schema properties", () => {
    const input = buildActionInput({
      action,
      tokens: [
        "--calendar-id",
        "primary",
        "--query",
        "standup",
        "--limit",
        "3",
        "--include-cancelled",
      ],
      setExpressions: [],
    });

    expect(input).toEqual({
      calendar_id: "primary",
      query: "standup",
      limit: 3,
      include_cancelled: true,
    });
  });

  it("merges stdin, --input, and --set with later sources winning", () => {
    const input = buildActionInput({
      action,
      tokens: ["--calendar-id", "primary", "--query", "billing review"],
      stdinText: '{"limit":1,"filters":{"owner":"ops"}}',
      inputJson: '{"limit":5}',
      setExpressions: ["filters.owner=finance", "filters.include_virtual=true"],
    });

    expect(input).toEqual({
      limit: 5,
      filters: {
        owner: "finance",
        include_virtual: true,
      },
      calendar_id: "primary",
      query: "billing review",
    });
  });

  it("fails when required fields are missing", () => {
    expect(() =>
      buildActionInput({
        action,
        tokens: ["--calendar-id", "primary"],
        setExpressions: [],
      })
    ).toThrow("Missing required fields: query");
  });
});

