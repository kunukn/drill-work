# Supply-chain audit — @tanstack/\* "Mini Shai-Hulud" compromise

Reference: <https://socket.dev/blog/tanstack-npm-packages-compromised-mini-shai-hulud-supply-chain-attack> (Socket, 2026-05-11)

## Context

Socket disclosed a supply-chain attack against `@tanstack/*` npm packages: 84 compromised artifacts containing a credential-harvesting payload. The implant ships `router_init.js` (SHA-256 `ab4fcadaec49c03278063dd269ea5eef82d24f2124a8e15d7b90f2fa8601266c`), drops `router_runtime.js` / `setup.mjs` into developer `.claude/` and `.vscode/` directories, can tamper with `settings.json` hooks and `tasks.json`, and exfiltrates secrets (npm tokens, GitHub PATs/OIDC, AWS, Vault, K8s SA tokens) to `filev2.getsession.org`. It also pushes commits authored as `claude@users.noreply.github.com`. The malicious injection vector adds an optional `@tanstack/setup` dependency pointing at `github:tanstack/router#79ac49eedf774dd4b0cfa308722bc463cfe5885c` and runs it via a `prepare` lifecycle hook.

This repo depends on:

- `@tanstack/react-query` (pinned `5.100.8`)
- `@tanstack/react-router` (pinned `1.132.0`)
- `@tanstack/react-start` (pinned `1.132.0`)
- `@tanstack/router-plugin` (pinned `1.132.0`)

Goal: verify drill-work is not compromised and harden against future supply-chain attacks.

## Audit run on 2026-05-12

| Check                                            | Command                                                                               | Result                                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Installed `@tanstack/*` versions                 | `grep '@tanstack/' pnpm-lock.yaml`                                                    | router/start/plugin `1.132.0`, react-query/query-core `5.100.8`, store `0.7.7`, router-utils `1.161.7`. Lockfile installed ~May 1–3, ~10 days before the advisory. |
| `router_init.js` SHA-256 match                   | `find … -name router_init.js \| xargs shasum -a 256`                                  | None found.                                                                                                                                                        |
| Dropped payloads                                 | `find … \( -name router_runtime.js -o -name setup.mjs -o -name tanstack_runner.js \)` | None in repo, `node_modules`, `~/.claude`, `~/.vscode`.                                                                                                            |
| `@tanstack/setup` injected dep                   | `grep '@tanstack/setup' pnpm-lock.yaml package.json`                                  | Not present.                                                                                                                                                       |
| Malicious commit hash `79ac49ee…`                | `grep 79ac49eedf774dd4b0cfa308722bc463cfe5885c pnpm-lock.yaml`                        | Not present.                                                                                                                                                       |
| Domain IOCs `git-tanstack.com`, `getsession.org` | `grep -E 'git-tanstack\.com\|getsession\.org' pnpm-lock.yaml package.json`            | Not present.                                                                                                                                                       |
| Lifecycle scripts on `@tanstack/*`               | Iterated `node_modules/.pnpm/@tanstack+*/…/package.json`                              | No `postinstall` / `preinstall` / `prepare` / `install`.                                                                                                           |
| `.claude/` config tamper                         | Read `settings.json`, `settings.local.json`, `hooks/block-dangerous-git.sh`           | No foreign hooks or remote-script execs.                                                                                                                           |
| `.vscode/` config tamper                         | Read `settings.json`; no `tasks.json` exists                                          | Clean.                                                                                                                                                             |
| `~/.claude/` drops                               | `find ~/.claude -name router_runtime.js -o -name setup.mjs`                           | None.                                                                                                                                                              |
| Git author IOC                                   | `git log --all --author='claude@users.noreply.github.com'`                            | None. Only commit is `025df35` by Kunuk Nykjær.                                                                                                                    |

**Verdict: clean.** No secret rotation required for this repo. Steps in the advisory regarding npm tokens / OIDC do not apply — drill-work is `private: true` and does not publish.

## Hardening applied

- **Exact-pin** all direct `@tanstack/*` dependencies in `package.json` — no `^` ranges. `pnpm-lock.yaml` integrity hashes are the source of truth.
- Continue running `pnpm install --frozen-lockfile --ignore-scripts` in CI so installs fail if the lockfile drifts and no dependency lifecycle hook can execute.
- Default host install (see [README.md](../README.md) Option A) uses `pnpm install --ignore-scripts` followed by an explicit `pnpm prepare` for husky — blocking arbitrary dep `prepare` / `postinstall` code from running on contributor machines.

## Reusable audit playbook

Run these on this repo or any other before trusting `pnpm install` after a fresh advisory.

```sh
# 1. List installed @tanstack/* versions and compare to advisory IOCs
grep -E '@tanstack/' pnpm-lock.yaml | sort -u

# 2. Hash-scan node_modules for the known payload
find node_modules -type f -name 'router_init.js' -print0 \
  | xargs -0 shasum -a 256
# Match against ab4fcadaec49c03278063dd269ea5eef82d24f2124a8e15d7b90f2fa8601266c

# 3. Find dropped helper files anywhere it matters
find . ~/.claude ~/.vscode "$HOME/Library/Application Support/Code/User" \
  -type f \( -name 'router_runtime.js' -o -name 'setup.mjs' -o -name 'tanstack_runner.js' \) 2>/dev/null

# 4. Look for the injected dep and its commit pin
grep -nE '@tanstack/setup|79ac49eedf774dd4b0cfa308722bc463cfe5885c|git-tanstack\.com|getsession\.org' \
  package.json pnpm-lock.yaml

# 5. Check for install-time scripts on @tanstack packages
for f in node_modules/.pnpm/@tanstack+*/node_modules/@tanstack/*/package.json; do
  node -e "const p=require('./$f'); const s=p.scripts||{};
    if (s.postinstall||s.preinstall||s.prepare||s.install)
      console.log('$f', JSON.stringify(s))"
done

# 6. Diff editor / agent config vs. committed
diff -u <(git show HEAD:.claude/settings.json) .claude/settings.json
diff -u <(git show HEAD:.vscode/settings.json) .vscode/settings.json

# 7. Search git history for the implant's author
git log --all --author='claude@users.noreply.github.com' --pretty=fuller
```

## Decision rule

Rotate secrets (npm tokens → GitHub PATs / OIDC trusts → AWS → Vault → K8s SA) only if **any** of:

- An installed `@tanstack/*` version falls inside the advisory's bad-version window.
- A `router_init.js` hash matches the IOC, or `router_runtime.js` / `setup.mjs` / `tanstack_runner.js` is present.
- A `.claude/` or `.vscode/` config grew foreign hooks/tasks or remote-script execs.
- Git history shows a `claude@users.noreply.github.com` commit you did not make through the official Claude Code GitHub App.
