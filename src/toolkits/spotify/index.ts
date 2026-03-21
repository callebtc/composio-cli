import { defineToolkit } from "../shared.js";

export const spotifyToolkit = defineToolkit({
  directoryName: "spotify",
  cliName: "spotify",
  apiSlug: "spotify",
  displayName: "Spotify",
  summary: "playlists",
  capabilities: ["playlists", "tracks", "search"],
  examples: ["get-current-user-s-playlists", "create-playlist", "search-for-item"],
  readCheckActions: ["list-playlists", "get-playlist"],
  featuredActions: [
    {
      canonical: "get-current-user-s-playlists",
      priority: 100,
      shortHelp: "List the current user's playlists.",
    },
    {
      canonical: "get-playlist",
      priority: 90,
      shortHelp: "Read a playlist and its metadata.",
    },
    {
      canonical: "create-playlist",
      priority: 80,
      shortHelp: "Create a new playlist.",
    },
    {
      canonical: "add-items-to-playlist",
      priority: 70,
      shortHelp: "Add tracks or episodes to a playlist.",
    },
    {
      canonical: "search-for-item",
      priority: 60,
      shortHelp: "Search Spotify for tracks, artists, or playlists.",
    },
  ],
});
