import { defineToolkit } from "../shared.js";

export const jiraToolkit = defineToolkit({
  directoryName: "jira",
  cliName: "jira",
  apiSlug: "jira",
  displayName: "Jira",
  summary: "create issues, sprints, boards",
  capabilities: ["issues", "sprints", "boards"],
  examples: ["search-issues", "create-issue", "list-boards"],
  readCheckActions: ["list-boards", "list-sprints"],
  featuredActions: [
    {
      canonical: "search-issues",
      priority: 100,
      shortHelp: "Search issues with JQL or simple filters.",
    },
    {
      canonical: "get-issue",
      priority: 90,
      shortHelp: "Read one issue by key or ID.",
    },
    {
      canonical: "create-issue",
      priority: 80,
      shortHelp: "Create a new Jira issue.",
    },
    {
      canonical: "transition-issue",
      priority: 70,
      shortHelp: "Move an issue to a new workflow state.",
    },
    {
      canonical: "list-boards",
      priority: 60,
      shortHelp: "List boards before inspecting sprints.",
    },
    {
      canonical: "edit-issue",
      priority: 50,
      shortHelp: "Update fields on an existing Jira issue.",
    },
    {
      canonical: "add-comment",
      priority: 40,
      shortHelp: "Comment on an issue.",
    },
    {
      canonical: "assign-issue",
      priority: 30,
      shortHelp: "Assign an issue to a user.",
    },
    {
      canonical: "list-sprints",
      priority: 20,
      shortHelp: "List sprints for a board.",
    },
    {
      canonical: "get-project",
      priority: 10,
      shortHelp: "Inspect one Jira project.",
    },
  ],
});
