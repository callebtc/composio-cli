import { defineToolkit } from "../shared.js";

export const jiraToolkit = defineToolkit({
  directoryName: "jira",
  cliName: "jira",
  apiSlug: "jira",
  displayName: "Jira",
  summary: "create issues, sprints, boards",
  capabilities: ["issues", "sprints", "boards"],
  examples: ["list-boards", "list-sprints", "create-issue"],
  readCheckActions: ["list-boards", "list-sprints"],
});

