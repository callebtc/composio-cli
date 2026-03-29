---
name: composio-cli
description: "Use this skill whenever the user asks you to interact with external connected services or data. Make sure to use this skill whenever the user mentions reading/sending emails, managing calendar events, interacting with Google Docs/Sheets/Drive/Maps, or working with tools like GitHub, Slack, Notion, Jira, Linear, Discord, Twitter, Salesforce, Figma, Stripe, Zendesk, or Spotify. Trigger this skill to perform actions on the user's behalf from the terminal, even if they don't explicitly ask for 'Composio'."
---

# composio-cli

Use this repository's CLI instead of hand-writing Composio SDK calls or API requests when the user wants to work with connected Composio toolkits from the terminal. This provides a unified, secure way to interact with hundreds of external tools.

## Installation & Setup

If the `composio-cli` command is not available in your environment, install it globally:

```bash
npm install -g composio-cli
# Or if you are in the source repository:
npm link
```

## Connecting New Accounts

If the user asks you to interact with a service (e.g., Jira, Slack) but it is not currently enabled or connected, **do not** attempt to build an OAuth flow or write custom API integration code.

Instead, tell the user they need to connect their service account in the **Clawi integrations dashboard** first, and then run `composio-cli connections` to verify it's active.

## Core workflow

Always prefer this sequence to ensure you are grounded in what is actually connected and avoid inventing unsupported action names:

1. **Discover connected toolkits:**

   ```bash
   composio-cli toolkits
   composio-cli connections
   ```

2. **Discover actions for a specific toolkit:**

   ```bash
   composio-cli <toolkit> actions
   ```

3. **Inspect the JSON schema for an action:**
   _ALWAYS_ inspect an action before running it to understand the required inputs.

   ```bash
   composio-cli <toolkit> inspect <action>
   ```

4. **Execute the action:**
   ```bash
   composio-cli <toolkit> <action> --flag value
   # Or using a JSON payload for complex inputs:
   composio-cli <toolkit> <action> --input '{"key":"value"}'
   ```

## Important behavior

- **Active Accounts Only:** The CLI only shows toolkits with an active connected account for the effective user.
- **Summary Mode:** Text mode hides low-signal metadata. Summary-capable read actions default to compact text output.
- **Full Data:** Use `--json` for the full machine-readable payload if you need exact raw response fields.
- **Bypass Summary:** Use `--full` to bypass the compact summary in text mode.
- **Reduce Context:** Use `--fields a,b` or `--ids-only` to reduce context further when listing many items.

## Common Task Examples

**Example 1: Managing Emails (Gmail)**
_Task: The user wants to find recent emails or send a new one._

```bash
# Read recent emails
composio-cli gmail fetch-emails --max-results 5 --fields subject,date
# Send a new email
composio-cli gmail send-email --recipient a@example.com --subject "Hi" --body "Hello"
```

**Example 2: Managing Schedule (Google Calendar)**
_Task: The user wants to check their schedule or create a meeting._

```bash
# Find a specific event
composio-cli google-calendar find-event --calendar-id primary --query "meeting"
# Create a new meeting
composio-cli google-calendar create-event --calendar-id primary --summary "Standup" --start-datetime <iso> --end-datetime <iso>
```

**Example 3: Working with Documents (Google Docs)**
_Task: The user wants to find a document or read its contents._

```bash
# Search for a document
composio-cli google-docs search-documents --query "Q1 plan"
# Read a document's plaintext
composio-cli google-docs get-document-plaintext --document-id <doc-id>
```

## Agent guidance

- **Do not guess** toolkit names or action names. Ask the CLI via `composio-cli toolkits` and `composio-cli <toolkit> actions`.
- **Always `inspect`** before execution if the action inputs are unclear to ensure you provide the correct JSON or flags.
- For large read operations, start with default summary output before escalating to `--json`.
- If the user asks for one specific object after a summary list, use the relevant ID-based follow-up action (e.g., after finding a message ID, run `fetch-message-by-message-id`).
