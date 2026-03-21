import { defineToolkit } from "../shared.js";

export const dropboxToolkit = defineToolkit({
  directoryName: "dropbox",
  cliName: "dropbox",
  apiSlug: "dropbox",
  displayName: "Dropbox",
  summary: "files, shared links",
  capabilities: ["files", "shared links"],
  examples: ["list-files", "list-shared-links", "upload-file"],
  readCheckActions: ["list-files", "list-shared-links"],
});

