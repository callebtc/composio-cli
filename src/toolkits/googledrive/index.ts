import { defineToolkit } from "../shared.js";

export const googleDriveToolkit = defineToolkit({
  directoryName: "googledrive",
  cliName: "google-drive",
  apiSlug: "googledrive",
  displayName: "Google Drive",
  summary: "upload, find, move, create folder",
  capabilities: ["upload", "find", "move", "folders"],
  examples: ["find-file", "upload-file", "create-folder"],
  readCheckActions: ["find-files"],
  aliases: ["googledrive", "drive"],
  featuredActions: [
    {
      canonical: "find-file",
      priority: 100,
      shortHelp: "Search Drive files and folders by name or filters.",
    },
    {
      canonical: "upload-file",
      priority: 90,
      shortHelp: "Upload a new file into Google Drive.",
    },
    {
      canonical: "create-folder",
      priority: 80,
      shortHelp: "Create a folder before organizing files.",
    },
    {
      canonical: "move-file",
      priority: 70,
      shortHelp: "Move an existing file into another folder.",
    },
    {
      canonical: "download-file",
      priority: 60,
      shortHelp: "Download a file when you need the raw contents.",
    },
  ],
});
