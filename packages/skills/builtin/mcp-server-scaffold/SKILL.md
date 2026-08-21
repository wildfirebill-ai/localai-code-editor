---
name: mcp-server-scaffold
description: Scaffold a working MCP stdio server exposing real tools — manifest, handlers, test with the editor
category: ai-integration
---
Build an MCP server that plugs into this editor (or any MCP client):

1. **Pick the capability**: one focused tool beats five vague ones. Define name, description (the model reads it to decide usage — write it like documentation for a junior dev), and a JSON-schema input with per-field descriptions.
2. **Scaffold** with the official SDK (`@modelcontextprotocol/sdk` TypeScript or `mcp` Python):
   - stdio transport for local tools; log to STDERR only — stdout is the protocol channel, a stray console.log corrupts the stream.
   - Each tool handler: validate input against the schema defensively, do the work, return structured content.
3. **Safety by default**: filesystem tools resolve+confine to a declared root; shell tools take explicit allowlists; never trust paths/args without normalization. Return actionable error messages — the model will read them and retry intelligently.
4. **Register in the editor**: add to `mcpServers` in localai.config.json (`{ "type": "stdio", "command": "node", "args": ["dist/index.js"] }`) or connect live from the MCP panel. Confirm the tools appear in Connected Tools.
5. **Test through the agent**: ask the AI to use the tool; verify the call arrives, arguments parse, result renders. Iterate on the description if the model picks wrong parameters — that's a prompt problem, not a code bug.
6. **Ship**: build step, README documenting each tool + schema + example prompt.

Report: tool list with schemas, editor connection proof, one real agent-driven invocation.
