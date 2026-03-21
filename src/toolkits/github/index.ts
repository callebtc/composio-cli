import { defineToolkit } from "../shared.js";

export const githubToolkit = defineToolkit({
  directoryName: "github",
  cliName: "github",
  apiSlug: "github",
  displayName: "GitHub",
  summary: "issues, PRs, commits, branches, repos",
  capabilities: ["issues", "pull requests", "commits", "branches", "repos"],
  examples: ["search-repositories", "list-repository-issues", "create-an-issue"],
  readCheckActions: ["list-repos", "get-repo"],
  featuredActions: [
    {
      canonical: "search-repositories",
      priority: 100,
      shortHelp: "Find repositories by name or query.",
    },
    {
      canonical: "get-a-repository",
      priority: 90,
      shortHelp: "Inspect one repository before making changes.",
    },
    {
      canonical: "list-repository-issues",
      priority: 80,
      shortHelp: "Read open issues in a repository.",
    },
    {
      canonical: "create-an-issue",
      priority: 70,
      shortHelp: "Open a new GitHub issue.",
    },
    {
      canonical: "create-a-pull-request",
      priority: 60,
      shortHelp: "Open a pull request from a branch.",
    },
  ],
});
