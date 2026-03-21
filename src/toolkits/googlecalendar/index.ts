import { defineToolkit } from "../shared.js";

export const googleCalendarToolkit = defineToolkit({
  directoryName: "googlecalendar",
  cliName: "google-calendar",
  apiSlug: "googlecalendar",
  displayName: "Google Calendar",
  summary: "create/find/patch events, free slots, list calendars",
  capabilities: ["events", "free slots", "calendars"],
  examples: ["list-calendars", "find-event", "find-free-slots"],
  readCheckActions: ["list-calendars", "find-event", "events-list"],
  aliases: ["googlecalendar", "calendar"],
});

