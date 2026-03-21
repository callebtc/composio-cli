import { defineToolkit } from "../shared.js";

export const githubToolkit = defineToolkit({
  directoryName: "github",
  cliName: "github",
  apiSlug: "github",
  displayName: "GitHub",
  summary: "issues, PRs, commits, branches, repos",
  capabilities: ["issues", "pull requests", "commits", "branches", "repos"],
  examples: ["list-repos", "get-repo", "get-issues"],
  readCheckActions: ["list-repos", "get-repo"],
});

