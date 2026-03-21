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
    {
      canonical: "list-files",
      priority: 50,
      shortHelp: "List files across Drive with broader filters.",
    },
    {
      canonical: "get-file-metadata",
      priority: 40,
      shortHelp: "Inspect one file's metadata and parents.",
    },
    {
      canonical: "create-file-from-text",
      priority: 30,
      shortHelp: "Create a text file directly from inline content.",
    },
    {
      canonical: "parse-file",
      priority: 20,
      shortHelp: "Extract readable content from a Drive file.",
    },
    {
      canonical: "edit-file",
      priority: 10,
      shortHelp: "Update an existing Drive file.",
    },
  ],
});
