import { defineToolkit } from "../shared.js";

export const googleDriveToolkit = defineToolkit({
  directoryName: "googledrive",
  cliName: "google-drive",
  apiSlug: "googledrive",
  displayName: "Google Drive",
  summary: "upload, find, move, create folder",
  capabilities: ["upload", "find", "move", "folders"],
  examples: ["find-files", "create-folder", "upload-file"],
  readCheckActions: ["find-files"],
  aliases: ["googledrive", "drive"],
});

