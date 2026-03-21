import { normalizeToken, unique } from "../utils/strings.js";

export interface SummaryFieldDefinition<T> {
  key: string;
  label: string;
  aliases?: string[];
  value(item: T): string | undefined;
}

export function resolveRequestedSummaryFields<T>(
  fields: SummaryFieldDefinition<T>[],
  requested: string[] | undefined
): SummaryFieldDefinition<T>[] | undefined {
  if (!requested || requested.length === 0) {
    return undefined;
  }

  const resolved: SummaryFieldDefinition<T>[] = [];
  const unknown: string[] = [];

  for (const requestedField of requested) {
    const normalized = normalizeToken(requestedField);
    const match = fields.find(field => getFieldAliases(field).includes(normalized));
    if (!match) {
      unknown.push(requestedField);
      continue;
    }
    if (!resolved.includes(match)) {
      resolved.push(match);
    }
  }

  if (unknown.length > 0) {
    throw new Error(
      `Unknown summary field${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}. Available fields: ${fields.map(field => field.key).join(", ")}.`
    );
  }

  return resolved;
}

export function formatSummaryModeSuffix(display: {
  idsOnly: boolean;
  fields?: string[] | undefined;
}): string {
  if (display.idsOnly) {
    return " (ids only)";
  }
  if (display.fields && display.fields.length > 0) {
    return ` (fields: ${display.fields.join(", ")})`;
  }
  return "";
}

function getFieldAliases<T>(field: SummaryFieldDefinition<T>): string[] {
  return unique([field.key, ...(field.aliases ?? [])].map(alias => normalizeToken(alias)));
}
