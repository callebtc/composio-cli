import { defineToolkit } from "../shared.js";

export const dropboxToolkit = defineToolkit({
  directoryName: "dropbox",
  cliName: "dropbox",
  apiSlug: "dropbox",
  displayName: "Dropbox",
  summary: "files, shared links",
  capabilities: ["files", "shared links"],
  examples: ["list-files-in-folder", "upload-file", "create-shared-link-simple"],
  readCheckActions: ["list-files", "list-shared-links"],
  featuredActions: [
    {
      canonical: "list-files-in-folder",
      priority: 100,
      shortHelp: "List files inside a Dropbox folder.",
    },
    {
      canonical: "search-file-or-folder",
      priority: 90,
      shortHelp: "Search Dropbox by file or folder name.",
    },
    {
      canonical: "upload-file",
      priority: 80,
      shortHelp: "Upload a file into Dropbox.",
    },
    {
      canonical: "create-shared-link-simple",
      priority: 70,
      shortHelp: "Create a shareable link for a file or folder.",
    },
    {
      canonical: "create-folder",
      priority: 60,
      shortHelp: "Create a folder before uploading files.",
    },
  ],
});
