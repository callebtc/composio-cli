import { defineToolkit } from "../shared.js";
import { googleCalendarOutputSummary } from "./summary.js";

export const googleCalendarToolkit = defineToolkit({
  directoryName: "googlecalendar",
  cliName: "google-calendar",
  apiSlug: "googlecalendar",
  displayName: "Google Calendar",
  summary: "create/find/patch events, free slots, list calendars",
  capabilities: ["events", "free slots", "calendars"],
  examples: ["events-list", "create-event", "find-free-slots"],
  readCheckActions: ["list-calendars", "find-event", "events-list"],
  aliases: ["googlecalendar", "calendar"],
  featuredActions: [
    {
      canonical: "events-list",
      aliases: ["list-events"],
      priority: 100,
      shortHelp: "List upcoming events from one calendar.",
    },
    {
      canonical: "events-get",
      aliases: ["get-event"],
      priority: 90,
      shortHelp: "Read one event by its event ID.",
    },
    {
      canonical: "create-event",
      priority: 80,
      shortHelp: "Create a calendar event with time, title, and attendees.",
    },
    {
      canonical: "find-free-slots",
      priority: 70,
      shortHelp: "Find open time ranges across calendars.",
    },
    {
      canonical: "list-calendars",
      priority: 60,
      shortHelp: "See which calendars are available to query.",
    },
    {
      canonical: "find-event",
      priority: 50,
      shortHelp: "Search for matching events by text or filters.",
    },
    {
      canonical: "patch-event",
      priority: 40,
      shortHelp: "Update a few fields on an existing event.",
    },
    {
      canonical: "update-event",
      priority: 30,
      shortHelp: "Replace an event when you have the full payload.",
    },
    {
      canonical: "quick-add",
      priority: 20,
      shortHelp: "Create an event from natural-language text.",
    },
    {
      canonical: "get-calendar",
      priority: 10,
      shortHelp: "Inspect one calendar by calendar ID.",
    },
  ],
  outputSummary: googleCalendarOutputSummary,
});
