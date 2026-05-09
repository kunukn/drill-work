# MCP install

## GitHub Copilot CLI

Add at user scope (available across all your projects):

```bash
copilot mcp add playwright -- npx @playwright/mcp@latest
```

Add at project scope (shared via `.vscode/mcp.json`, checked into the repo):

```bash
copilot mcp add -s project playwright -- npx @playwright/mcp@latest
```

Add at local scope (this project only, not shared):

```bash
copilot mcp add -s local playwright -- npx @playwright/mcp@latest
```

List configured servers:

```bash
copilot mcp list
```

## Claude Code

Add at user scope (default — available across all your projects):

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Add at project scope (shared via `.mcp.json`, checked into the repo):

```bash
claude mcp add -s project playwright npx @playwright/mcp@latest
```

Add at local scope (this project only, not shared):

```bash
claude mcp add -s local playwright npx @playwright/mcp@latest
```
