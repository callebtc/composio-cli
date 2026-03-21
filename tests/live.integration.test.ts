import { describe, expect, it } from "vitest";
import { runCli } from "../src/run-cli.js";

const apiKey = process.env.COMPOSIO_API_KEY;
const shouldRun = process.env.COMPOSIO_LIVE_TESTS === "1" && Boolean(apiKey);

describe.skipIf(!shouldRun)("live Composio validation", () => {
  it("lists Gmail actions and can run a read-only Gmail command", async () => {
    const actions = await runCli(["gmail", "actions", "--api-key", apiKey!, "--json"], {
      stdoutIsTTY: false,
    });
    expect(actions.exitCode).toBe(0);
    const parsedActions = JSON.parse(actions.stdout) as Array<{ cliName: string }>;
    expect(parsedActions.some(action => action.cliName === "list-labels")).toBe(true);

    const result = await runCli(["gmail", "list-labels", "--api-key", apiKey!, "--json"], {
      stdoutIsTTY: false,
    });
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as { successful: boolean; toolSlug: string };
    expect(payload.successful).toBe(true);
    expect(payload.toolSlug).toBe("GMAIL_LIST_LABELS");
  });

  it("runs a read-only Google Calendar command", async () => {
    const result = await runCli(
      ["google-calendar", "list-calendars", "--api-key", apiKey!, "--json"],
      {
        stdoutIsTTY: false,
      }
    );
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as { successful: boolean; toolSlug: string };
    expect(payload.successful).toBe(true);
    expect(payload.toolSlug).toBe("GOOGLECALENDAR_LIST_CALENDARS");
  });
});

