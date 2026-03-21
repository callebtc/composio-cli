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
    {
      canonical: "render-images-of-file-nodes",
      priority: 50,
      shortHelp: "Render image exports for specific nodes.",
    },
    {
      canonical: "get-file-components",
      priority: 40,
      shortHelp: "List components defined in a Figma file.",
    },
    {
      canonical: "get-local-variables",
      priority: 30,
      shortHelp: "Inspect local variables and design tokens.",
    },
    {
      canonical: "design-tokens-to-tailwind",
      priority: 20,
      shortHelp: "Convert extracted tokens into Tailwind-ready output.",
    },
    {
      canonical: "get-comments-in-a-file",
      priority: 10,
      shortHelp: "Read comments on a Figma file.",
    },
  ],
});
