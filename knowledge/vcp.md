# VCP (Vibe Coding Protocol) — Three-Layer Security & Quality Enforcement

VCP is an open-source Claude Code plugin created by Mark Huang that enforces 40 security, architecture, and quality standards across 12 technology scopes. It exists because AI-generated code has a 2.74x higher vulnerability rate than human-written code (CodeRabbit 2025) and 45% of AI-generated code contains security flaws (Veracode 2025).

GitHub: https://github.com/Z-M-Huang/vcp

## The Three Layers

### Layer 1: Proactive Context (Session Start)

When a Claude Code session starts, VCP injects applicable security and architecture rules directly into the AI's context. The AI internalizes these rules while writing code — before generating anything. This prevents bad code before it reaches disk.

Rules are scoped per project. For markhuang.ai, the active scopes are: `web-frontend`, `web-backend`, `database`, and `devops`.

### Layer 2: Real-Time Blocking (Every File Write)

A PreToolUse hook intercepts every Write, Edit, and Bash call. It scans for 21 dangerous patterns across 9 CWEs:

- **CWE-798**: Hardcoded secrets (API keys, tokens, private keys)
- **CWE-89**: SQL injection via string concatenation
- **CWE-95**: Code injection via dynamic code execution with user input
- **CWE-79**: XSS via innerHTML
- **CWE-502**: Insecure deserialization
- **CWE-1321**: Prototype pollution
- Plus obfuscated shell commands, path traversal, and hardcoded paths

If a dangerous pattern is detected, the hook returns exit code 2 — Claude Code refuses to write the code. This works even with `--dangerously-skip-permissions` enabled, because it's a hook, not a permission prompt.

Documentation files (.md, .mdx, .txt, .rst) are exempt — you can write about vulnerabilities without triggering the gate.

### Layer 3: On-Demand Scanning (When You Ask)

Ten skills provide deep AI-driven analysis against the full standards library:

| Skill | Purpose |
|-------|---------|
| `/vcp-audit` | Full standards audit with validation pass |
| `/vcp-pre-commit-review` | Review changed files before committing (PASS/BLOCK verdict) |
| `/vcp-dependency-check` | Check lockfiles, version ranges, typosquatting |
| `/vcp-review-tests` | Analyze test quality and anti-patterns |
| `/vcp-coverage-gaps` | Find untested functions and missing edge cases |
| `/vcp-test-plan` | Generate structured test plans |
| `/vcp-root-cause-check` | Verify a bug fix addresses root cause, not symptoms |

## Standards Coverage

VCP enforces standards across these areas:

- **Core**: Security, architecture, error handling, code quality, testing, dependency management, secure defaults, API design, data flow security, concurrency
- **Web Frontend**: Security (XSS, CSP, CSRF), structure, performance, accessibility
- **Web Backend**: Security (SQLi, auth, sessions), structure, data access, API design, caching, real-time
- **Database**: Encryption, schema security
- **DevOps**: Container security, CI/CD pipeline security, IaC security, Kubernetes security
- **Compliance**: GDPR, PCI DSS, HIPAA frameworks

## Why Layer 2 Matters

The `--dangerously-skip-permissions` flag in Claude Code removes all permission prompts, letting the AI execute any tool call without user approval. Real incidents have shown AI agents executing destructive commands, wiping home directories, and deleting production databases.

VCP's Layer 2 security gate is a PreToolUse hook — it runs before the tool executes, regardless of permission settings. It's the last line of defense when permissions are skipped.

The recommended setup: run `--dangerously-skip-permissions` only inside a Docker container with VCP's security gate enabled. You get the speed of no permission prompts with the safety of pattern-matched blocking, and the blast radius is limited to the container filesystem.

## How It's Used on This Site

markhuang.ai's VCP configuration (`/.vcp/config.json`) has four active scopes: web-frontend, web-backend, database, and devops. The detected frameworks include Next.js, React, TypeScript, Tailwind CSS, Go, Chi, PostgreSQL, GORM, and Docker.

Every code change goes through all three layers: context injection at session start, real-time blocking on every write, and on-demand audits before commits and releases.
