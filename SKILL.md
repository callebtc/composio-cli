---
name: composio-cli
description: "Use this skill whenever the user wants to interact with email, calendars, documents, maps, drive files, spreadsheets, chat tools, issue trackers, CRMs, design tools, storage tools, media tools, search tools, or similar connected services from the terminal. Trigger it for Gmail, Google Calendar, Google Docs, Google Maps, Google Drive, Google Sheets, Slack, GitHub, Notion, Linear, Jira, HubSpot, Salesforce, Airtable, Asana, Trello, Discord, Twitter, WhatsApp, Stripe, Zendesk, Dropbox, Figma, YouTube, Spotify, search, and other connected services."
---

# composio-cli

Use this repository's CLI instead of hand-writing Composio SDK calls when the user wants to work with connected Composio toolkits from the terminal.

## When to use this

Use this skill when the user wants to:

- read, search, draft, or send Gmail messages
- inspect calendars, list events, or find free slots
- use Google Docs, Google Maps, Drive, Sheets, or other connected Google tools
- run Slack, GitHub, Notion, Linear, Jira, HubSpot, Salesforce, Airtable, Asana, Trello, Discord, Twitter, WhatsApp, Stripe, Zendesk, Dropbox, Figma, YouTube, Spotify, or Composio Search actions
- discover which Composio toolkits/actions are connected and available
- execute a Composio action from the CLI with flags or JSON input

## Core workflow

1. Make sure the CLI is built if needed.

```bash
pnpm build
```

2. Set the API key once for the session.

```bash
export COMPOSIO_API_KEY="..."
```

3. Discover connected toolkits and connections.

```bash
node dist/cli.js
node dist/cli.js toolkits
node dist/cli.js connections
```

4. Inspect live actions for one toolkit.

```bash
node dist/cli.js <toolkit> actions
node dist/cli.js <toolkit> inspect <action>
```

5. Execute the action.

```bash
node dist/cli.js <toolkit> <action> --flag value
node dist/cli.js <toolkit> <action> --input '{"key":"value"}'
```

## Important behavior

- The CLI only shows toolkits with an active connected account for the effective user.
- Action lists are discovered live from Composio at runtime.
- Text mode hides low-signal metadata.
- Summary-capable read actions default to compact text output.
- Use `--json` for the full machine-readable payload.
- Use `--full` to bypass the compact summary in text mode.
- Use `--fields a,b` or `--ids-only` to reduce context further.

## Authentication

Set the API key once at the beginning:

```bash
export COMPOSIO_API_KEY="..."
```

If needed, target a specific user with:

```bash
--user <id>
```

## Recommended command pattern

Prefer this sequence:

1. `toolkits`
2. `<toolkit> actions`
3. `<toolkit> inspect <action>`
4. `<toolkit> <action> ...`

This keeps the agent grounded in what is actually connected and avoids inventing unsupported action names.

## Important examples

Start with:

```bash
node dist/cli.js
node dist/cli.js toolkits
node dist/cli.js gmail actions
node dist/cli.js gmail inspect fetch-emails
```

Gmail:

```bash
node dist/cli.js gmail fetch-emails --max-results 5
node dist/cli.js gmail fetch-emails --max-results 5 --fields subject,date
node dist/cli.js gmail fetch-emails --max-results 5 --ids-only
node dist/cli.js gmail fetch-message-by-message-id --message-id <message-id> --json
node dist/cli.js gmail create-email-draft --recipient a@example.com --subject "Hi" --body "Hello"
node dist/cli.js gmail send-email --recipient a@example.com --subject "Hi" --body "Hello"
node dist/cli.js gmail search-people --query "Alice"
node dist/cli.js gmail list-labels
```

Google Calendar:

```bash
node dist/cli.js google-calendar list-calendars
node dist/cli.js google-calendar events-list --calendar-id primary
node dist/cli.js google-calendar events-get --calendar-id primary --event-id <event-id> --json
node dist/cli.js google-calendar create-event --calendar-id primary --summary "Standup" --start-datetime <iso> --end-datetime <iso>
node dist/cli.js google-calendar find-free-slots --items '["primary"]' --time-min <iso> --time-max <iso>
node dist/cli.js google-calendar find-event --calendar-id primary --query "meeting"
```

Google Docs:

```bash
node dist/cli.js google-docs actions
node dist/cli.js google-docs create-document --title "Draft"
node dist/cli.js google-docs get-document-by-id --document-id <doc-id> --json
node dist/cli.js google-docs get-document-plaintext --document-id <doc-id>
node dist/cli.js google-docs search-documents --query "Q1 plan"
node dist/cli.js google-docs update-document-markdown --document-id <doc-id> --markdown "# Title"
```

Google Maps:

```bash
node dist/cli.js google-maps actions
node dist/cli.js google-maps text-search --text-query "coffee near Alexanderplatz"
node dist/cli.js google-maps nearby-search --location <lat,lng> --radius 1000
node dist/cli.js google-maps get-place-details --place-id <place-id>
node dist/cli.js google-maps get-route --origin "Berlin" --destination "Munich"
node dist/cli.js google-maps autocomplete --input "berlin cen"
```

Other common toolkit entry points:

```bash
node dist/cli.js google-drive actions
node dist/cli.js google-sheets actions
node dist/cli.js slack actions
node dist/cli.js github actions
node dist/cli.js notion actions
node dist/cli.js linear actions
node dist/cli.js jira actions
node dist/cli.js airtable actions
node dist/cli.js asana actions
node dist/cli.js trello actions
node dist/cli.js dropbox actions
node dist/cli.js figma actions
node dist/cli.js youtube actions
node dist/cli.js spotify actions
node dist/cli.js composio-search actions
```

## Agent guidance

- Do not guess toolkit names or action names. Ask the CLI.
- Prefer `inspect` before execution if the action inputs are unclear.
- For large read operations, start with default summary output before escalating to `--json`.
- If the user asks for exact raw response fields, rerun with `--json`.
- If the user asks for one specific object after a summary list, use the relevant ID-based follow-up action.
