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
    {
      canonical: "get-a-task",
      priority: 50,
      shortHelp: "Read one task in detail.",
    },
    {
      canonical: "get-sections-in-project",
      priority: 40,
      shortHelp: "List sections inside a project.",
    },
    {
      canonical: "create-subtask",
      priority: 30,
      shortHelp: "Create a subtask under an existing task.",
    },
    {
      canonical: "add-task-to-section",
      priority: 20,
      shortHelp: "Move or add a task into a project section.",
    },
    {
      canonical: "search-tasks-in-workspace",
      priority: 10,
      shortHelp: "Search tasks across a workspace.",
    },
  ],
});
