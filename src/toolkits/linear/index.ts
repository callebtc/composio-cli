import { defineToolkit } from "../shared.js";

export const linearToolkit = defineToolkit({
  directoryName: "linear",
  cliName: "linear",
  apiSlug: "linear",
  displayName: "Linear",
  summary: "issues, projects, teams, states",
  capabilities: ["issues", "projects", "teams", "workflow states"],
  examples: ["list-linear-issues", "search-issues", "create-linear-issue"],
  readCheckActions: ["list-issues", "list-projects"],
  featuredActions: [
    {
      canonical: "list-linear-issues",
      priority: 100,
      shortHelp: "List issues across the workspace.",
    },
    {
      canonical: "search-issues",
      priority: 90,
      shortHelp: "Find issues by text or filters.",
    },
    {
      canonical: "get-linear-issue",
      priority: 80,
      shortHelp: "Read one issue in detail.",
    },
    {
      canonical: "create-linear-issue",
      priority: 70,
      shortHelp: "Create a new issue.",
    },
    {
      canonical: "update-issue",
      priority: 60,
      shortHelp: "Update status, assignee, or fields on an issue.",
    },
  ],
});
