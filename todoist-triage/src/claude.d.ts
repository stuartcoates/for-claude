/**
 * The slice of the claude.ai artifact runtime this app uses. The full contract is
 * served by claude.ai; here we only declare `use("mcp")` and `callTool`.
 * Outside claude.ai, `window.claude` is undefined.
 */
interface ClaudeMcpError {
  code: string;
  message: string;
  server?: string;
  retryable?: boolean;
  retryAfterMs?: number;
}

interface ClaudeMcpResult {
  content: unknown[];
  structuredContent?: unknown;
  payload?: unknown;
}

interface ClaudeMcp {
  callTool(server: string, tool: string, input?: unknown, options?: { cache?: false }): Promise<ClaudeMcpResult>;
}

interface Window {
  claude?: { use(name: string): Promise<unknown> };
}
