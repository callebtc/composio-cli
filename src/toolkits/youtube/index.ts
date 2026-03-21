import { defineToolkit } from "../shared.js";

export const youtubeToolkit = defineToolkit({
  directoryName: "youtube",
  cliName: "youtube",
  apiSlug: "youtube",
  displayName: "YouTube",
  summary: "video details, search, captions",
  capabilities: ["videos", "search", "captions"],
  examples: ["search-you-tube", "video-details", "load-captions"],
  readCheckActions: ["search-videos", "get-video-details"],
  featuredActions: [
    {
      canonical: "search-you-tube",
      priority: 100,
      shortHelp: "Search YouTube videos by keyword.",
    },
    {
      canonical: "video-details",
      priority: 90,
      shortHelp: "Read details for one video.",
    },
    {
      canonical: "list-channel-videos",
      priority: 80,
      shortHelp: "List videos from a channel.",
    },
    {
      canonical: "load-captions",
      priority: 70,
      shortHelp: "Load caption text for a video.",
    },
    {
      canonical: "get-channel-statistics",
      priority: 60,
      shortHelp: "Inspect channel metrics and counts.",
    },
  ],
});
