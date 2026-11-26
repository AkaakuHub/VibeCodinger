# Workflows

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
A workflow is a TypeScript script that chains agents, plain code, schedules, webhooks, issue and pull request events, and questions to you into one durable run that survives server restarts. Each step's result is saved when it succeeds, so restarts pick up where the run left off and failures do not lose earlier work. Workflows are an early feature: start runs from the `vibecodinger` CLI or a trigger, and follow them in the app.
=======
Workflows (Labs) are durable TypeScript scripts that chain agents, code steps, schedules, webhooks, issue/PR triggers, and human approvals into multi-stage runs that survive server restarts. Each completed step is checkpointed so restarts resume where they left off.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

Use a **scheduled task** for a single prompt on a timer or webhook; use a **workflow** for multi-stage pipelines (e.g., triage → fix → approval → release).

## Enable workflows

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Workflows are a Labs feature, off by default. Turn on **Settings → Labs → Workflows** for the server that runs them. On a server without a desktop, set `"workflowsEnabled": true` in `userdata/settings.json` in its T3 home (`~/.vibecodinger` by default). While off, nothing in the workflows folder runs and `vibecodinger workflow` says how to turn it on; runs are kept and continue once it is on again.

## Create a workflow

Workflow files live in `~/.vibecodinger/workflows/` (or wherever `VIBECODINGER_WORKFLOWS` points — a folder or a single file). The server watches the folder and reloads changes without a restart.

- **Ask an agent (recommended):** copy the [`vibecodinger-workflows` skill](https://github.com/pingdotgg/t3code/blob/main/skills/vibecodinger-workflows/SKILL.md) into your agent's skills folder (such as `~/.claude/skills/` or `~/.agents/skills/`) and describe what you want.
- **Edit directly:** edit files in `~/.vibecodinger/workflows/`, or use **Definitions** on the Workflows page (saving and deleting in the app require terminal access). Before anything has run, open the page with **Open workflows** in the command palette.

A small workflow, saved as `~/.vibecodinger/workflows/release.ts`:
=======
Turn on **Settings → Labs → Workflows** on the server that will run them (or set `"workflowsEnabled": true` in `~/.t3/userdata/settings.json` on headless servers). Existing runs pause while disabled and resume when re-enabled.

## Create a workflow

Place `.ts` files in `~/.t3/workflows/` (or the path in `T3CODE_WORKFLOWS`). The server watches the folder and hot-reloads valid edits.

- **With an agent (recommended)**: Copy the [`t3-workflows` skill](https://github.com/pingdotgg/t3code/blob/main/skills/t3-workflows/SKILL.md) into your agent's skills folder (e.g. `~/.claude/skills/` or `~/.agents/skills/`) and describe what you want.
- **Directly**: Edit files in `~/.t3/workflows/` or use **Definitions** on the Workflows page (**Open workflows** in the command palette; saving/deleting in the app requires terminal access).

Example (`~/.t3/workflows/release.ts`):
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

```ts
const { workflow, step, ask, stop, title } = T3;

export default workflow(
  "release",
  { version: 1, payload: Schema.Struct({ name: Schema.String }) },
  Effect.fn(function* (payload) {
    yield* title(`Release ${payload.name}`);
    const notes = yield* step("notes", { returns: Schema.String }, Effect.succeed("3 fixes"));
    const answer = yield* ask("ship", {
      title: `Ship ${payload.name}? ${notes}`,
      choices: ["Ship", "Hold"],
    });
    if (Option.isNone(answer) || answer.value.choice !== "Ship") return yield* stop("held back");
    return { shipped: payload.name };
  }),
);
```

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Start it with `vibecodinger workflow start release --input '{"name":"v1.4"}' --key v1.4`, then answer its question in the app. `T3`, `Effect`, `Schema` and `Option` are provided; a workflow file imports nothing from T3 or Effect. Name files with letters, digits, `-`, `_` and `.`; other names are skipped with a warning.
=======
- `T3`, `Effect`, `Schema`, and `Option` are globals—no imports needed.
- Filenames may use letters, digits, `-`, `_`, and `.`. Dot-files and subfolders are ignored (put shared helpers in a subfolder; restart the server after editing imported helpers).
- **Versioning**: Keep older workflow versions defined while they have unfinished runs; bump `version` to deploy new steps alongside active runs.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

## CLI commands

```sh
<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
vibecodinger workflow start <name> --input '<json>' --key <key>
vibecodinger workflow list [--status paused]
vibecodinger workflow show <run>
vibecodinger workflow resume <run>
vibecodinger workflow cancel <run> [--reason '<why>']
vibecodinger workflow questions
vibecodinger workflow signal '{"choice":"yes"}' --run <run> --wait <name>
vibecodinger workflow signal '<json>' --workflow <name> --channel <channel>
vibecodinger workflow hooks
vibecodinger workflow store list
vibecodinger workflow store set <key> '<json>'
```

Every start needs a `--key`: starting twice with the same key returns the same run — even after a version bump — so retries do not duplicate work. Use `signal` with `--run` and `--wait` to answer a question or wake a run, or with `--workflow` and `--channel` to wake whichever run waits on that channel. A signal for a question that is no longer open is kept for a later wait rather than refused, so check `vibecodinger workflow questions` first. Use `store` to read or change state kept between runs.

## Triggers

- **Schedules:** `every` runs on an interval, starting one interval after the workflow loads; `daily` runs at a local time of day (a time missed by more than 10 minutes while the server is down is skipped).
- **Webhooks:** `vibecodinger workflow hooks` prints each hook's path; prepend your server's address. The path contains the hook's secret, so share it only with the sender. A sender's retry that repeats its delivery header (such as GitHub's `X-GitHub-Delivery`) starts no second run, and bodies over 1 MiB are refused. A hook starts at most 60 runs a minute; requests past that get `429` and can be sent again a minute later. Organization policies blocking webhook tasks block workflow webhooks too.
- **Issues and pull requests:** workflows can start on new issues or pull requests and read, comment on, or update them via **Settings → Source control & issues** — no webhook needed. T3 Code checks roughly once a minute, and only items opened after the workflow was first loaded start runs.
=======
t3 workflow start <name> --input '<json>' --key <key>
t3 workflow list [--status paused] [--tag <tag>] [--subject <url or id>]
t3 workflow show <run>
t3 workflow resume <run>
t3 workflow cancel <run> [--reason '<why>']
t3 workflow questions [--kind <kind>]
t3 workflow signal '{"choice":"yes"}' --run <run> --wait <name>
t3 workflow signal '<json>' --workflow <name> --channel <channel>
t3 workflow withdraw --run <run> --wait <name> [--reason '<why>']
t3 workflow hooks
t3 workflow store list
t3 workflow store set <key> '<json>'
```

- `--key` deduplicates starts across retries and version bumps.
- `signal` answers an open question or wakes a channel wait (signals sent before a channel wait are buffered for 7 days by default).
- `withdraw` cancels an open question so `ask` returns `None`.
- `store` reads/writes shared state persisted between runs.

## Questions, tags, and subjects

- **Question kinds & tags**: Declare `asks: { kindKey: "Label" }` in workflow options and pass `kind` to `ask(...)` to filter open questions under **Needs you** (and `t3 workflow questions --kind <kind>`). Use `tags([...])` to label runs for filtering.
- **Rich choices & links**: Pass `links: [{ label, url }]` and choice objects `{ value, description, requireReason }` to require an explanation before answering. Answers record `answeredAt` and `answeredBy`.
- **Subjects**: Call `subject(issueOrPrOrThreadOrUrl)` (or pass `{ subject }` to `start(...)`) to display and link the target item in run lists, issue/PR views, and `t3 workflow list --subject <url>`.

## Concurrency limits

- **Whole-workflow cap**: Set `concurrency: 4` in workflow options.
- **Step pools**: Wrap a section in `within("builders", { limit: 4 }, ...)` (`limit: 1` acts as a lock). Waiting runs show as **Queued** in FIFO order; resumed runs re-acquire their pools first.
- Avoid nesting `within` on the same pool name (or a workflow's own concurrency pool), and avoid holding a lock across `invoke` if the child needs the same pool. Step names starting with `@pool:` are reserved.

## Triggers

- **Schedules**: `every` runs on an interval; `daily` runs at a local time of day (skipped if missed by >10 minutes while offline).
- **Webhooks**: Run `t3 workflow hooks` to get each hook's secret path (prepend your server URL). Deduplicates retries by delivery header (e.g. `X-GitHub-Delivery`), rejects bodies >1 MiB, and rate-limits to 60 runs/min (`429`). Blocked if managed policy disables webhooks.
- **Issues & PRs**: Triggers automatically on new issues or PRs via **Settings → Source control & issues** (polled ~every minute; only items opened after the workflow first loads).
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

## Follow runs, agent threads, and failures

Open **Open workflows** from the command palette (web/desktop) to filter **Needs you**, **Running**, or **All**, inspect agent threads, answer questions, resume, or cancel runs.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
### Agent threads

Each `agent` step runs in an ordinary thread, left out of thread lists (including `vibecodinger thread list`). Open it from the run to watch it live, read its transcript, or send follow-up messages; the thread links back to the run.

An `agent` step can launch a new thread with its own `workspace` (such as a worktree), `runtimeMode`, `interactionMode`, `title`, and typed `returns`, or continue an earlier step's thread. Runs can set their display name with `title(text)`. An `agent` step can also target a project on a [linked environment](remote-access.md#link-another-environment) (requires **Settings → Labs → Linked environments**); the run itself stays on the server that started it.

### Failures, pause, and cancel

A plain code step runs once unless it asks for retries. When a step fails, the run pauses there instead of losing earlier work:

- **Code step failures** retry automatically after 5, 20, and 80 minutes by default, or immediately when you resume; only that step runs again.
- **Agent failures** — when an agent ran and gave up or timed out — pause and wait for you to resume rather than retrying automatically. An agent that could not be started at all, for example because its environment was offline, retries on its own like a failed step.

Cancelling a run stops its active agent turns and cancels child runs it invoked. A cancelled run cannot be resumed.

## Limits

- Runs live on the server that started them and only advance while it is running; use an always-on machine for schedules or webhooks you cannot miss.
- Keep older workflow versions defined until their unfinished runs end or are cancelled.
- Signals sent to a `channel` before a run waits on it are kept for 7 days by default.
=======
- **Agent steps**: Each `agent` step runs in a regular thread (hidden from sidebar lists) that you can open live from the run. Supports custom `workspace`, `runtimeMode`, `interactionMode`, `title`, typed `returns`, and [linked environments](./remote-access.md#link-another-environment).
- **Retries & pausing**: Failed code steps auto-retry after 5, 20, and 80 minutes (or immediately on **Resume**). Failed or timed-out agent steps pause for manual resume (offline-start failures auto-retry). Cancelling stops active agent turns and child runs permanently.
- **Skipped runs**: Up to 500 skipped top-level runs are kept per workflow (configurable via **Settings → Labs → Skipped runs kept** or `"workflowSkippedRunsKept"` in `settings.json`).
- **Always-on requirement**: Runs only advance while the server that started them is online.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432
