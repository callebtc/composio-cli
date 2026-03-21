import { defineToolkit } from "../shared.js";

export const figmaToolkit = defineToolkit({
  directoryName: "figma",
  cliName: "figma",
  apiSlug: "figma",
  displayName: "Figma",
  summary: "files, nodes, design tokens, images",
  capabilities: ["files", "nodes", "design tokens", "images"],
  examples: ["get-file-json", "get-file-nodes", "extract-design-tokens"],
  readCheckActions: ["get-file", "get-nodes"],
  featuredActions: [
    {
      canonical: "get-file-json",
      priority: 100,
      shortHelp: "Fetch the full Figma file document.",
    },
    {
      canonical: "get-file-nodes",
      priority: 90,
      shortHelp: "Fetch specific nodes by node ID.",
    },
    {
      canonical: "extract-design-tokens",
      priority: 80,
      shortHelp: "Extract colors, typography, and other design tokens.",
    },
    {
      canonical: "download-figma-images",
      priority: 70,
      shortHelp: "Download rendered images from Figma.",
    },
    {
      canonical: "get-file-metadata",
      priority: 60,
      shortHelp: "Inspect file metadata and structure.",
    },
  ],
});
