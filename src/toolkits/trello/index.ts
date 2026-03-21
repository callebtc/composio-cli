import { defineToolkit } from "../shared.js";

export const trelloToolkit = defineToolkit({
  directoryName: "trello",
  cliName: "trello",
  apiSlug: "trello",
  displayName: "Trello",
  summary: "boards, lists, cards",
  capabilities: ["boards", "lists", "cards"],
  examples: ["get-members-me-boards", "get-boards-lists-by-id-board", "add-cards"],
  readCheckActions: ["list-boards", "list-lists"],
  featuredActions: [
    {
      canonical: "get-members-me-boards",
      priority: 100,
      shortHelp: "List your Trello boards.",
    },
    {
      canonical: "get-boards-lists-by-id-board",
      priority: 90,
      shortHelp: "List lists on a board.",
    },
    {
      canonical: "get-lists-cards-by-id-list",
      priority: 80,
      shortHelp: "Read cards in a list.",
    },
    {
      canonical: "add-cards",
      priority: 70,
      shortHelp: "Create a new Trello card.",
    },
    {
      canonical: "update-cards-by-id-card",
      priority: 60,
      shortHelp: "Update a card's name, list, or fields.",
    },
    {
      canonical: "get-boards-by-id-board",
      priority: 50,
      shortHelp: "Read one board by its ID.",
    },
    {
      canonical: "get-boards-cards-by-id-board",
      priority: 40,
      shortHelp: "List cards on a board.",
    },
    {
      canonical: "get-cards-by-id-card",
      priority: 30,
      shortHelp: "Read one card in detail.",
    },
    {
      canonical: "add-lists",
      priority: 20,
      shortHelp: "Create a new list on a board.",
    },
    {
      canonical: "add-cards-actions-comments-by-id-card",
      priority: 10,
      shortHelp: "Add a comment to an existing card.",
    },
  ],
});
