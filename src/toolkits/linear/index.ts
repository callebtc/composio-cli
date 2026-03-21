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
    {
      canonical: "list-linear-projects",
      priority: 50,
      shortHelp: "Browse projects in the workspace.",
    },
    {
      canonical: "list-linear-teams",
      priority: 40,
      shortHelp: "List teams before filtering issues.",
    },
    {
      canonical: "list-linear-states",
      priority: 30,
      shortHelp: "Inspect workflow states for a team.",
    },
    {
      canonical: "get-linear-project",
      priority: 20,
      shortHelp: "Read one project in detail.",
    },
    {
      canonical: "create-linear-project",
      priority: 10,
      shortHelp: "Create a new Linear project.",
    },
  ],
});
