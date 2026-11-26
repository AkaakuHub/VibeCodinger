# Outside agents

Connect external agents (Claude Code or Codex in your terminal, ChatGPT, or any OAuth-capable MCP client) to your T3 Code environment over MCP to read projects/threads, launch and message threads, and monitor events.

## Quick setup

Open the command palette (`Cmd/Ctrl+K`) and run **Use T3 Code in another app (MCP)** (or open **Settings → Sharing & access**), pick your app, and follow the prompts.

- Cloud assistants (like ChatGPT or Claude) require **T3 Connect** enabled on the environment.
- To also reach other machines through the same connection, enable **Settings → Labs → Linked environments** and [link them](./remote-access.md#link-another-environment).
- To copy the raw MCP endpoint (`https://<environment-address>/mcp`), open an environment's menu in **Settings → Environments → Copy MCP URL**. OAuth requires `https://` or `localhost` (plain `http://` LAN/Tailscale addresses cannot complete OAuth).

### CLI clients and ChatGPT

- **Claude Code**:
  ```sh
  claude mcp add --transport http t3 https://<environment-address>/mcp
  claude mcp login t3   # add --no-browser on headless hosts
  ```
- **Codex**:
  ```sh
  codex mcp add t3 --url https://<environment-address>/mcp
  codex mcp login t3    # add --no-browser on headless hosts
  ```
- **ChatGPT / other OAuth MCP clients**: Add a custom remote MCP server pointing to `https://<environment-address>/mcp` with **OAuth** authentication (no client ID or secret needed).

## Approve access and permissions

The first time an outside agent connects, approve its sign-in page (via your T3 Connect account, an already-authorized browser, or a one-time pairing code from **Settings → Sharing & access** / `t3 auth pairing create`).

- **Read only**: Inspect projects, threads, providers, and models.
- **Supervised → Full access**: Also launch, message, and stop threads up to the granted permission mode. Managing [workflow runs](./workflows.md) or using approval-skipping agent modes requires **Full access** (or your policy's maximum mode).
- Sign-ins last **30 days**; revoke anytime in **Settings → Sharing & access**.

## Available tools and limits

Tools that act as a running T3 thread (`delegate_task`, `create_threads`, `request_secret`, `html_render`, `preview_*`, `device_*`, `t3_worktree_handoff`) only work for agents running **inside** T3 Code.

- Use `t3_thread_launch` + `t3_thread_wait` / `t3_thread_read` to run and follow work.
- Pass `projectId` or `threadId` explicitly (or `allProjects: true` on `t3_thread_list`).
- **MCP Events (`io.modelcontextprotocol/events`)**: Bots can poll, stream, or subscribe via HTTPS webhooks (up to 1-hour leases; latest 1,000 milestones buffered in memory) for turn, approval, guest, PR watch, and workflow events. For local webhook testing, set `T3CODE_MCP_WEBHOOK_ALLOWED_HOSTS=localhost,127.0.0.1` on the server.

## Host scripts (`t3 thread`)

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Only approve a sign-in you just started. On the environment's own page, enter a
code from **Use T3 Code in another app (MCP)**, **Settings → Sharing & access**,
or `vibecodinger auth pairing create` on the host. A browser already signed in to the
environment with permission to manage access can approve without a code. On the
web app, **Use a sign-in code instead** opens the environment's own page.

A code from **Use T3 Code in another app (MCP)** already carries the level you
picked there. With another code, choose what the agent may do here: **Auto** is
selected by default, or the closest lower mode allowed by your organization’s
policy. Approving without a code starts at **Read only**:

- **Read only** lets the agent read projects and threads and see
  the available providers and models. It cannot change anything.
- **Supervised** through **Full access** also let it start, message and stop
  threads in every project. A thread it starts or steers cannot run with more
  permissions than the mode you chose. [Workflow runs](workflows.md) choose
  their own modes, so only **Full access** (or the highest mode your
  organization's policy allows) can start, answer, resume or cancel them,
  change what workflows store, or read webhook paths. Lower modes can still
  read runs.

## What outside agents can call

Some tools only work for an agent running inside a T3 thread, because they act
as that thread: subagents, secret requests, rendered HTML, the browser preview,
devices, and worktree handoff. They still appear in an outside agent's tool
list, but calling one returns an error saying it needs an agent running inside
T3 Code.

- To hand off work, start a thread with `t3_thread_launch`, then follow it with
  `t3_thread_wait` or `t3_thread_read`, instead of `create_threads` or
  `delegate_task`.
- Tools that default to the caller's own project or thread need an explicit
  `projectId` or `threadId`.
- To list threads across projects, call `t3_thread_list` with
  `allProjects: true`, or use `t3_thread_search`.

## Claude Code

```sh
claude mcp add --transport http vibecodinger https://<environment-address>/mcp
claude mcp login vibecodinger
```

`claude mcp login` opens the sign-in page in your browser. On a machine
without a browser, add `--no-browser`, open the printed URL elsewhere, and
paste the final URL back when asked. `claude mcp list` shows `vibecodinger` as connected
once you approve.

## Codex

```sh
codex mcp add vibecodinger --url https://<environment-address>/mcp
codex mcp login vibecodinger
```

`codex mcp login --no-browser` prints the sign-in URL instead of opening it.
`codex mcp list` shows `vibecodinger` with OAuth once you approve.

## ChatGPT

Add the environment as a custom MCP app in ChatGPT's apps settings:

1. Create a new app or plugin with a custom MCP server.
2. Set the server URL to `https://<environment-address>/mcp`, using the T3
   Connect address.
3. Choose **OAuth** for authentication. ChatGPT discovers the rest; you do not
   need a client ID or secret.
4. Create the app, then approve the sign-in page that opens.

## Other agents and bots

Any agent that supports remote MCP servers over HTTP with OAuth can connect. Give
it the MCP URL and choose OAuth, and the agent finds the sign-in settings itself.
Agents without OAuth support cannot connect.

A bot that supports MCP Events (`io.modelcontextprotocol/events`) can learn
when something happens without reading threads over and over: a turn ended, an
agent waits on a person, a guest asked something, a watched pull request woke
its thread. [Workflow runs](workflows.md) are events too: a run started, paused,
resumed or ended, or waits on a person. A bot can poll, stream, or receive each
event type by webhook, narrowed to projects and threads or to workflows and
runs; runs another run started are left out unless asked for, as subagent
threads are, and narrowing thread events to a run picks out its agent steps.
The environment keeps its latest 1,000 milestones in memory, so a bot that was
away longer, or reconnects after a restart, is told some may be missing and
should reread what it cares about. Webhooks go only to public `https` addresses,
a subscription lasts at most an hour before the bot must renew it, and signing
the bot out ends its subscriptions. To test with a receiver on your own machine
or network, start the environment with `VIBECODINGER_MCP_WEBHOOK_ALLOWED_HOSTS` set to
its host names, for example `localhost,127.0.0.1`; those hosts may also use
plain `http`.

## Scripts on the host

On the machine that runs the environment, `vibecodinger thread` uses the same tools
without a sign-in:
=======
On the server machine itself, drive threads directly without OAuth:
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

```sh
id=$(vibecodinger thread start . "Find why the tests are slow")
vibecodinger thread send "$id" "Now fix it" --wait
vibecodinger thread show "$id"
vibecodinger thread list
```

- Pass `--worktree <base-branch>`, `--title` / `--generate-title`, `--provider <id> --model <slug>`, `--option id=value` (e.g. `reasoningEffort=high` for Codex, `effort=high` for Claude), or `-` to read the prompt from stdin.
- `--wait` prints the reply and exits `1` on failure/stop or `2` when waiting for user input. Add `--json` for structured output including the thread ID.
