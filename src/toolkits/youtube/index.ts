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
    {
      canonical: "list-user-playlists",
      priority: 50,
      shortHelp: "List playlists for the current user.",
    },
    {
      canonical: "list-playlist-items",
      priority: 40,
      shortHelp: "List videos inside a playlist.",
    },
    {
      canonical: "get-video-details-batch",
      priority: 30,
      shortHelp: "Fetch details for multiple videos at once.",
    },
    {
      canonical: "list-comment-threads",
      priority: 20,
      shortHelp: "Read comment threads on a video.",
    },
    {
      canonical: "create-playlist",
      priority: 10,
      shortHelp: "Create a new YouTube playlist.",
    },
  ],
});
