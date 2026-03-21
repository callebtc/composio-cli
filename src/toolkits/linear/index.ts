import { defineToolkit } from "../shared.js";

export const linearToolkit = defineToolkit({
  directoryName: "linear",
  cliName: "linear",
  apiSlug: "linear",
  displayName: "Linear",
  summary: "issues, projects, teams, states",
  capabilities: ["issues", "projects", "teams", "workflow states"],
  examples: ["list-issues", "list-projects", "list-teams"],
  readCheckActions: ["list-issues", "list-projects"],
});

