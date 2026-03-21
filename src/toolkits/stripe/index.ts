import { defineToolkit } from "../shared.js";

export const stripeToolkit = defineToolkit({
  directoryName: "stripe",
  cliName: "stripe",
  apiSlug: "stripe",
  displayName: "Stripe",
  summary: "invoices",
  capabilities: ["invoices", "customers", "payments"],
  examples: ["list-invoices", "get-invoice"],
  readCheckActions: ["list-invoices"],
});

