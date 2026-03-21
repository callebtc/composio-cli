import { defineToolkit } from "../shared.js";

export const twitterToolkit = defineToolkit({
  directoryName: "twitter",
  cliName: "twitter",
  apiSlug: "twitter",
  displayName: "Twitter",
  summary: "post, delete, lookup, media upload",
  capabilities: ["tweets", "lookup", "media"],
  examples: ["recent-search", "creation-of-a-post", "upload-media"],
  readCheckActions: ["lookup-tweets"],
  featuredActions: [
    {
      canonical: "recent-search",
      priority: 100,
      shortHelp: "Search recent posts by keyword.",
    },
    {
      canonical: "post-lookup-by-post-id",
      priority: 90,
      shortHelp: "Read one post by ID.",
    },
    {
      canonical: "creation-of-a-post",
      priority: 80,
      shortHelp: "Publish a new post.",
    },
    {
      canonical: "upload-media",
      priority: 70,
      shortHelp: "Upload media before posting.",
    },
    {
      canonical: "user-lookup-by-username",
      priority: 60,
      shortHelp: "Resolve a username to a Twitter user.",
    },
    {
      canonical: "user-home-timeline-by-user-id",
      priority: 50,
      shortHelp: "Read a user's home timeline.",
    },
    {
      canonical: "followers-by-user-id",
      priority: 40,
      shortHelp: "List followers for a user.",
    },
    {
      canonical: "following-by-user-id",
      priority: 30,
      shortHelp: "List who a user follows.",
    },
    {
      canonical: "user-like-post",
      priority: 20,
      shortHelp: "Like a post on behalf of the user.",
    },
    {
      canonical: "retweet-post",
      priority: 10,
      shortHelp: "Retweet a post.",
    },
  ],
});
