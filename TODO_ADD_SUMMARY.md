# TODO: Add Summary Output Modes

This file is a handoff note for the next agent working on summary-mode output.

## What "summary output" means

Some Composio actions return large payloads. For agent use, the default text output should be a compact summary instead of dumping the full JSON response.

The current contract is:

- Default text mode: show a compact summary when the action supports it.
- `--json`: always return the full raw execution payload.
- `--full`: bypass the compact summary and return the normal text-mode JSON dump.
- `--fields a,b`: project the summary to selected fields only.
- `--ids-only`: show only stable identifiers.

The goal is to reduce context usage for agents while still making it easy to drill into one item or fetch the full response when needed.

## Where the summary feature is wired

Summary support is toolkit-owned.

- Summary contract: [src/toolkits/shared.ts](/Users/cc/git/composio-cli/src/toolkits/shared.ts)
  - `ToolkitOutputSummary`
  - `ToolkitSummaryRenderInput`
- Dispatcher: [src/toolkits/output.ts](/Users/cc/git/composio-cli/src/toolkits/output.ts)
- Help text that advertises summary support: [src/help.ts](/Users/cc/git/composio-cli/src/help.ts)
  - `renderActionGuide()` shows:
    - `Default text output is summarized...`
    - `Output controls: --fields a,b, --ids-only, --full, --json`
- Actual execution rendering path: [src/help.ts](/Users/cc/git/composio-cli/src/help.ts)
  - `renderExecutionResult()` calls `renderSummarizedExecutionResult(...)`

Toolkit-local implementations live under the toolkit directory:

- Gmail: [src/toolkits/gmail/summary.ts](/Users/cc/git/composio-cli/src/toolkits/gmail/summary.ts)
- Google Calendar: [src/toolkits/googlecalendar/summary.ts](/Users/cc/git/composio-cli/src/toolkits/googlecalendar/summary.ts)

Toolkit registration happens in each toolkit `index.ts` file via `outputSummary`.

Examples:

- [src/toolkits/gmail/index.ts](/Users/cc/git/composio-cli/src/toolkits/gmail/index.ts)
- [src/toolkits/googlecalendar/index.ts](/Users/cc/git/composio-cli/src/toolkits/googlecalendar/index.ts)

## Supporting helpers

These helpers are already in place and should usually be reused:

- Summary field selection: [src/toolkits/summary-fields.ts](/Users/cc/git/composio-cli/src/toolkits/summary-fields.ts)
  - `resolveRequestedSummaryFields(...)`
  - `formatSummaryModeSuffix(...)`
- Replay / next-page command generation: [src/toolkits/follow-up.ts](/Users/cc/git/composio-cli/src/toolkits/follow-up.ts)
  - `findInputProperty(...)`
  - `buildReplayCommand(...)`

## What a good summary looks like

A good summary:

- shows only the highest-signal fields
- uses stable IDs when possible
- avoids dumping nested raw payloads
- truncates previews / snippets
- includes pagination or follow-up hints when available
- tells the agent how to fetch one full item or switch to full output

For list-style actions, the summary should usually include:

- item count
- 4 to 6 fields per item max
- `nextPageToken` / sync token / cursor when present
- a rerunnable follow-up command

For detail-style read actions, the summary should usually include:

- the resource ID
- the main title/name/subject
- the most relevant metadata
- no giant embedded blobs unless explicitly requested with `--json` or `--full`

## Existing examples

### Gmail

See [src/toolkits/gmail/summary.ts](/Users/cc/git/composio-cli/src/toolkits/gmail/summary.ts).

Implemented summary actions:

- `GMAIL_FETCH_EMAILS`
- `GMAIL_FETCH_MESSAGE_BY_THREAD_ID`
- `GMAIL_LIST_THREADS`
- `GMAIL_LIST_DRAFTS`
- `GMAIL_LIST_LABELS`
- `GMAIL_GET_CONTACTS`
- `GMAIL_GET_PEOPLE`
- `GMAIL_SEARCH_PEOPLE`

Example default summary shape for `fetch-emails`:

- message ID
- sender
- subject
- date
- labels
- preview truncated to 100 chars

Plus:

- next-page token
- rerunnable next-page command
- follow-up hint to fetch one full message by ID

Example command:

```bash
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5
```

Full payload:

```bash
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --json
```

### Google Calendar

See [src/toolkits/googlecalendar/summary.ts](/Users/cc/git/composio-cli/src/toolkits/googlecalendar/summary.ts).

Implemented summary groups:

- calendar list actions
- event list/search/sync actions
- free-busy actions

Example `events-list` summary:

- event ID
- summary/title
- start
- end
- organizer
- attendee count
- location

Plus:

- next-page token and replay command
- next-sync token and replay command

## How to add summary support for a new toolkit

1. Create a toolkit-local summary module.

Example:

- `src/toolkits/<toolkit>/summary.ts`

2. Export a `ToolkitOutputSummary`.

It must implement:

- `hasSummaryDefault(action)`
- `renderExecutionResult(result)`

3. Register it in the toolkit definition.

Example:

```ts
outputSummary: someToolkitOutputSummary
```

4. Add summary support only for actions that clearly benefit from compact output.

Good candidates:

- search/list/query actions
- list/read actions that return many items
- detail reads with huge nested payloads

Usually not needed for:

- small mutation acknowledgements
- simple create/update/delete responses
- actions whose raw payload is already tiny

5. Reuse shared helpers.

- Use `resolveRequestedSummaryFields(...)` for `--fields`
- Respect `result.display.idsOnly`
- Use `formatSummaryModeSuffix(...)` in the `Summary: ...` line
- Use `buildReplayCommand(...)` for pagination/follow-up commands

6. Add tests in [tests/run-cli.test.ts](/Users/cc/git/composio-cli/tests/run-cli.test.ts).

At minimum, add:

- summarized default text output
- empty-state summary
- `--ids-only`
- `--fields`
- `--full` bypasses summary
- projection flags rejected on actions without summary support

## Implementation checklist

For each toolkit/action set:

- identify the top list/search/read actions worth summarizing
- define the compact field set
- implement the toolkit-local summary renderer
- add follow-up / replay hints if pagination exists
- add tests
- optionally live-check with the Composio key if the toolkit is connected

## Current candidates

Unchecked items below are good next candidates for default summary output with `--json` as the explicit full-response escape hatch.

- [x] `gmail`: message/thread/draft/label/people summary actions
- [x] `google-calendar`: `list-calendars`, `find-event`, event list/search/sync results, free-busy
- [ ] `googledrive`: file search/list results
- [ ] `googlesheets`: large `read` range outputs
- [ ] `slack`: channel lists, history/thread reads
- [ ] `github`: repo lists, issue lists, PR lists, commit/branch listings
- [ ] `notion`: page search, database query results
- [ ] `linear`: issue/project/team listings
- [ ] `jira`: board, sprint, and issue listings
- [ ] `hubspot`: contact/deal search results
- [ ] `salesforce`: lead/contact search results
- [ ] `airtable`: record listings
- [ ] `asana`: task/project listings
- [ ] `trello`: board/list/card listings
- [ ] `dropbox`: file listings
- [ ] `figma`: file/node result sets
- [ ] `youtube`: search results, caption/search hit lists
- [ ] `spotify`: playlist track listings
- [ ] `zendesk`: ticket/user/search results
- [ ] `composio-search`: web/news/scholar/maps result lists

## Suggested next move

If continuing from here, `googledrive` is a good next target because its list/search payloads are usually large and the summary shape is straightforward:

- file ID
- name
- mime type
- parent/folder
- modified time
- size if available

Then add:

- replay hint for next page if the action supports pagination
- `--json` and `--full` escape hatches
- tests matching the Gmail / Google Calendar pattern
