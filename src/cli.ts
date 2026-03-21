#!/usr/bin/env node
import { runCli } from "./run-cli.js";

async function main(): Promise<void> {
  const stdinText = process.stdin.isTTY ? undefined : await readStdin();
  const result = await runCli(process.argv.slice(2), {
    env: process.env,
    stdinIsTTY: process.stdin.isTTY ?? false,
    stdoutIsTTY: process.stdout.isTTY ?? false,
    ...(stdinText !== undefined ? { stdinText } : {}),
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.exitCode;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

main().catch(error => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
