import { defineToolkit } from "../shared.js";

export const youtubeToolkit = defineToolkit({
  directoryName: "youtube",
  cliName: "youtube",
  apiSlug: "youtube",
  displayName: "YouTube",
  summary: "video details, search, captions",
  capabilities: ["videos", "search", "captions"],
  examples: ["search-videos", "get-video-details", "get-captions"],
  readCheckActions: ["search-videos", "get-video-details"],
});

