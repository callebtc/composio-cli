import { defineToolkit } from "../shared.js";

export const twitterToolkit = defineToolkit({
  directoryName: "twitter",
  cliName: "twitter",
  apiSlug: "twitter",
  displayName: "Twitter",
  summary: "post, delete, lookup, media upload",
  capabilities: ["tweets", "lookup", "media"],
  examples: ["lookup-tweets", "post-tweet", "upload-media"],
  readCheckActions: ["lookup-tweets"],
});

