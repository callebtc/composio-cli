import { defineToolkit } from "../shared.js";

export const asanaToolkit = defineToolkit({
  directoryName: "asana",
  cliName: "asana",
  apiSlug: "asana",
  displayName: "Asana",
  summary: "tasks, projects, sections",
  capabilities: ["tasks", "projects", "sections"],
  examples: ["list-tasks", "list-projects", "list-sections"],
  readCheckActions: ["list-tasks", "list-projects"],
});

