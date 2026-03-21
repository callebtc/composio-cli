import { defineToolkit } from "../shared.js";

export const asanaToolkit = defineToolkit({
  directoryName: "asana",
  cliName: "asana",
  apiSlug: "asana",
  displayName: "Asana",
  summary: "tasks, projects, sections",
  capabilities: ["tasks", "projects", "sections"],
  examples: ["get-a-project", "get-tasks-from-a-project", "create-a-task"],
  readCheckActions: ["list-tasks", "list-projects"],
  featuredActions: [
    {
      canonical: "get-a-project",
      priority: 100,
      shortHelp: "Read project metadata and settings.",
    },
    {
      canonical: "get-tasks-from-a-project",
      priority: 90,
      shortHelp: "List tasks in a project.",
    },
    {
      canonical: "create-a-task",
      priority: 80,
      shortHelp: "Create a new task.",
    },
    {
      canonical: "update-a-task",
      priority: 70,
      shortHelp: "Update task fields or status.",
    },
    {
      canonical: "create-task-comment",
      priority: 60,
      shortHelp: "Comment on a task.",
    },
  ],
});
