import { defineToolkit } from "../shared.js";

export const trelloToolkit = defineToolkit({
  directoryName: "trello",
  cliName: "trello",
  apiSlug: "trello",
  displayName: "Trello",
  summary: "boards, lists, cards",
  capabilities: ["boards", "lists", "cards"],
  examples: ["list-boards", "list-lists", "list-cards"],
  readCheckActions: ["list-boards", "list-lists"],
});

