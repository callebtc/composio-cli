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
    {
      canonical: "list-pull-requests",
      priority: 50,
      shortHelp: "List pull requests in a repository.",
    },
    {
      canonical: "get-a-pull-request",
      priority: 40,
      shortHelp: "Read one pull request in detail.",
    },
    {
      canonical: "merge-a-pull-request",
      priority: 30,
      shortHelp: "Merge a pull request once it is approved.",
    },
    {
      canonical: "create-or-update-file-contents",
      priority: 20,
      shortHelp: "Create or update a file directly in a repository.",
    },
    {
      canonical: "list-branches",
      priority: 10,
      shortHelp: "List repository branches before opening or merging PRs.",
    },
  ],
});
