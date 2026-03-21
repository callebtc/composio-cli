import { defineToolkit } from "../shared.js";

export const spotifyToolkit = defineToolkit({
  directoryName: "spotify",
  cliName: "spotify",
  apiSlug: "spotify",
  displayName: "Spotify",
  summary: "playlists",
  capabilities: ["playlists", "tracks", "search"],
  examples: ["list-playlists", "get-playlist"],
  readCheckActions: ["list-playlists", "get-playlist"],
});

