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
    {
      canonical: "read-file",
      priority: 50,
      shortHelp: "Read the contents of a Dropbox file.",
    },
    {
      canonical: "get-metadata",
      priority: 40,
      shortHelp: "Inspect one file or folder's metadata.",
    },
    {
      canonical: "move-file-or-folder",
      priority: 30,
      shortHelp: "Move or rename a file or folder.",
    },
    {
      canonical: "list-shared-links",
      priority: 20,
      shortHelp: "List shared links available to the account.",
    },
    {
      canonical: "get-temporary-link",
      priority: 10,
      shortHelp: "Get a short-lived direct download link for a file.",
    },
  ],
});
