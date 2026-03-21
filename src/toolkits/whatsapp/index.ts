import { defineToolkit } from "../shared.js";

export const whatsappToolkit = defineToolkit({
  directoryName: "whatsapp",
  cliName: "whatsapp",
  apiSlug: "whatsapp",
  displayName: "WhatsApp",
  summary: "send message, templates",
  capabilities: ["messages", "templates"],
  examples: ["send-message", "list-templates"],
  readCheckActions: ["list-templates"],
});

