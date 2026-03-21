import { defineToolkit } from "../shared.js";

export const figmaToolkit = defineToolkit({
  directoryName: "figma",
  cliName: "figma",
  apiSlug: "figma",
  displayName: "Figma",
  summary: "files, nodes, design tokens, images",
  capabilities: ["files", "nodes", "design tokens", "images"],
  examples: ["get-file", "get-nodes", "get-images"],
  readCheckActions: ["get-file", "get-nodes"],
});

