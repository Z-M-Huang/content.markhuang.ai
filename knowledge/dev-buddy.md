# Dev Buddy — Multi-AI Pipeline Orchestration

Dev Buddy is a Claude Code plugin (part of the VCP ecosystem) created by Mark Huang that orchestrates multiple AI models through structured development pipelines. Single-model self-review is unreliable — different models catch different issues.

## Why Multiple Models Matter

When one AI model writes code and reviews its own work, it tends to miss the same classes of issues it introduced. Dev Buddy uses models from different providers (Anthropic, OpenAI, MiniMax, Alibaba Bailian, and others) to provide independent perspectives on code quality, security, and correctness.

## Two Pipelines

### Feature Development

```
Requirements Gathering
    → Planning (with 5 parallel specialist explorations)
    → Plan Reviews (multiple independent reviewers)
    → Implementation
    → Code Reviews (multiple independent reviewers)
    → Automatic fix loops if any reviewer returns "needs_changes"
```

The five parallel specialists during planning cover: Technical feasibility, UX/Domain analysis, Security assessment, Performance analysis, and Architecture evaluation.

### Bug Fix

```
Root Cause Analysis (multiple independent analysts)
    → Consolidation (merge findings)
    → Plan Validation
    → Implementation
    → Code Reviews
```

Multiple RCA agents diagnose the bug independently before a consolidation step merges their findings into a single diagnosis.

## Task-Based Enforcement

Dev Buddy uses Claude Code's task system for structural enforcement instead of relying on instructions.

Traditional approach: "Run review A, then review B, then implement." The AI can skip steps.

Dev Buddy's approach: Create tasks with explicit `blockedBy` dependencies. When the orchestrator calls `TaskList()`, blocked tasks are invisible — the AI can only claim unblocked tasks. Skipping stages is structurally impossible because it's a data constraint, not an instruction.

## Multi-Provider Support

Dev Buddy supports three provider types:

- **Subscription**: Default Claude subscription via the Task tool (no API key needed)
- **API**: Any OpenAI-compatible or Anthropic-compatible API endpoint (MiniMax, Alibaba Bailian, OpenRouter, etc.)
- **CLI**: Command-line tools like OpenAI Codex CLI

On markhuang.ai, the actual pipeline configuration uses models from Anthropic (Claude), OpenAI (Codex), MiniMax (M2.5), and Alibaba Bailian — each providing independent review perspectives.

## Relationship to VCP and Golden CLAUDE.md

Dev Buddy operates within the governance established by the other two tools:

- **Golden CLAUDE.md** shapes how each AI agent in the pipeline behaves (honest, disciplined, verifying before acting)
- **VCP's Layer 2** blocks any dangerous code that any agent in the pipeline tries to write
- **Dev Buddy** ensures multiple independent models review every significant change

All three are used together on markhuang.ai.
