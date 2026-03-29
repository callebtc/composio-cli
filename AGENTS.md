# Agent Instructions for `composio-cli`

Welcome, AI coding agent! This document outlines the critical workflows, standards, and commands you must follow to safely and effectively contribute to the `composio-cli` repository.

## 1. Project Overview & Architecture

`composio-cli` is an agent-first TypeScript CLI application for interacting with Composio toolkits. It enables querying, executing, and inspecting toolkits (like GitHub, Slack, Notion) securely and via clear JSON/Flag interfaces. 

### Key Characteristics
- **Environment**: Node.js (`>=20.11.0`)
- **Language**: TypeScript (Strict)
- **Module System**: ESM (`"type": "module"` in `package.json`)
- **Package Manager**: `pnpm`
- **Testing Framework**: `vitest`

### Core Directories
- `src/`: Core logic, token parsing, CLI layout.
- `src/toolkits/`: Individual toolkit configuration (e.g., `twitter`, `discord`, `spotify`).
- `src/utils/`: Shared utilities (strings, json coercion).
- `tests/`: Vitest test suites.

---

## 2. Build, Lint, and Test Commands

*Before committing any code or finalizing a task, you MUST verify that your changes build correctly and pass existing tests.*

### Standard Commands
- **Install Dependencies**: `pnpm install`
- **Build**: `pnpm build` (Compiles TS using `tsconfig.build.json`)
- **Run Locally during Dev**: `pnpm dev -- <args>` (Uses `tsx` to run without compiling)
- **Typecheck**: `pnpm typecheck` (Runs `tsc --noEmit`)
- **Test All**: `pnpm test` (Runs Vitest)
- **Comprehensive Check**: `pnpm check` (Runs typecheck AND tests. **Do this before finalizing!**)

### Running a Single Test (Crucial for fast iteration)
Do NOT run the entire test suite while debugging a single failure. Use the path to the specific test file:
```bash
# Run a specific test file
pnpm vitest run tests/input.test.ts

# Run a specific test file with a name filter
pnpm vitest run tests/input.test.ts -t "fails when required fields are missing"
```

---

## 3. Code Style and Conventions

Adhere strictly to the following guidelines to maintain a pristine, uniform codebase.

### 3.1 Imports and Exports
- **ESM Extensions**: Because `type: "module"` is enabled, all relative imports **MUST** include the `.js` extension. 
  - ❌ *Bad*: `import { truncate } from "./utils/strings";`
  - ✅ *Good*: `import { truncate } from "./utils/strings.js";`
- **Type Imports**: Use `import type` to import interfaces and types.
- **Named Exports**: Prefer named exports over default exports for consistent refactoring.

### 3.2 Types and Interfaces
- Avoid `any` at all costs. Use `unknown` for dynamic values and narrow them via type guards or coercion.
- **Naming Types**: Use PascalCase for Interfaces and Types (e.g., `CliDisplayOptions`, `ConnectedAccountSummary`).
- **Strict Typing**: Ensure function parameters and return types are explicitly typed, especially exported functions.

### 3.3 Variable and Function Naming
- **Functions & Variables**: Use `camelCase` (e.g., `renderActionList`, `validateSharedFlags`).
- **Booleans**: Prefix with `is`, `has`, `should`, or `can` (e.g., `hasApiKey`, `isDeprecated`).
- **Global Constants**: Use `UPPER_SNAKE_CASE` (e.g., `API_KEY_ENV`, `TOOLKIT_PREVIEW_LIMIT`).

### 3.4 Error Handling & Output
- **Error Types**: The project uses an internal classification system. Rather than throwing generic `Error` instances, rely on structured error handling via `classifyCliError()` in `src/errors.js`.
- **Friendly Output**: Never `console.log` directly in the core logic. Instead, construct arrays of strings, `.filter()` undefined values, and `.join("\n")` them. Use helper functions from `src/utils/strings.js` (like `indent`, `truncate`, `formatRow`).
- **CLI Design**: Error messages should provide suggestions to the user on how to resolve the issue (e.g., "Pass --api-key <key>").

### 3.5 Formatting and Styling
- **Indentation**: 2 spaces.
- **Quotes**: Double quotes (`"`) for strings, unless single quotes are needed to avoid escaping internal double quotes (e.g., when embedding JSON).
- **Line Length**: Aim for ~100 characters max per line.
- **Object/Array Trailing Commas**: Use trailing commas in multi-line objects/arrays to keep Git diffs clean.

---

## 4. Testing Guidelines

The project uses `vitest`. When adding new features or fixing bugs:

1. **Write Tests First/Alongside**: Identify the relevant test file in `tests/` or create a new one mirroring the `src/` path (e.g., `src/foo.ts` -> `tests/foo.test.ts`).
2. **Assertions**: Use `expect(result).toEqual(...)` or `expect(result).toThrow(...)`.
3. **Mocking**: When making network calls or interacting with real APIs, intercept or mock the interaction using Vitest's mocking tools or mock input data.
4. **Test Coverage**: Focus tests on specific behaviors: Flag parsing, error classification, and correctly coerced JSON outputs.

---

## 5. Adding New Toolkits

When extending the CLI with new toolkits (e.g., `src/toolkits/new-toolkit.ts`):
- Use the `defineToolkit` function from `src/toolkits/shared.js`.
- Implement all required fields: `directoryName`, `cliName`, `apiSlug`, `displayName`, `summary`, `capabilities`, `examples`.
- Populate `featuredActions` to give users a high-quality discovery experience.
- Add the toolkit to the `index` exports and the main `enabledToolkits` registry.

---

## 6. Agent-Specific Tool Instructions

As an autonomous AI agent working in this repository, follow these rules regarding tool usage:

1. **Absolute Paths**: When using file system tools like `read` or `write` or `edit`, you **must** use absolute paths (e.g., `/Users/cc/git/composio-cli/package.json`).
2. **Bash over Edit for Complexity**: If an edit is extremely complex or spans many files, prefer writing a quick script or using `bash` tools alongside standard node utilities to confidently replace strings, or rely on `edit` carefully by preserving exact indentations.
3. **Read Before Write**: Always `read` a file before attempting to `edit` or `write` to it. You cannot reliably guess the contents.
4. **Search First**: Never assume you know where a function is located. Use `glob` to find file patterns or `grep` to locate function signatures across the repository.
5. **Incremental Commits**: Commit only when explicitly requested by the user, and never bypass pre-commit hooks unless instructed. 
6. **Task Verification**: Never consider a task complete until `pnpm check` successfully passes in a `bash` tool call.

*Remember: Quality, strict TypeScript compliance, and robust error handling are paramount to `composio-cli`.*