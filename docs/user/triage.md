# Triage an issue

Let your own coding agent investigate a T3 Code problem—reading local logs/state, inspecting the source for your installed version, checking known issues, and helping draft a GitHub issue. The agent always asks before applying fixes or posting anything.

## In the app

Open the command palette (`Cmd/Ctrl+K`) and run **Triage an issue**. A no-project thread opens on the active machine with the triage playbook attached—pick any provider, describe the problem, and send.

## In a terminal

If the app won't start or in-app triage fails, run:

```sh
npx vibecodinger triage
```

It starts Claude Code, Codex, or Antigravity in your terminal with the same
instructions. If more than one is installed, it asks which to use. You can also
choose explicitly:

```sh
npx vibecodinger triage --agent antigravity
npx vibecodinger triage --agent codex
```

Supports Claude Code, Codex, and standalone Antigravity (`agy` on `PATH` with its own sign-in; T3's managed ACP runtime does not include the standalone terminal CLI).
