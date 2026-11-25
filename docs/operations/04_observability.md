# Observability

The server writes logs to stdout and stores traces in a local NDJSON file. SSH-managed launches also write stdout to `~/.vibecodinger/ssh-launch/<state>/server.log`.

## Local traces and event-loop stalls

Default trace paths (`server.trace.ndjson`):

- Production / explicit `--home-dir` / `VIBECODINGER_HOME`: `<home>/userdata/logs/server.trace.ndjson`
- Linked worktree dev run: `<worktree>/.vibecodinger/userdata/logs/server.trace.ndjson`
- Non-worktree dev run: `~/.vibecodinger/dev/logs/server.trace.ndjson`

Summarize counts, rates, and latency percentiles offline (even while a server is stalled or stopped):

```sh
vibecodinger trace summary --since 30m --limit 40
# Set VIBECODINGER_TRACE_FILE=/path/to/server.trace.ndjson for dev or copied traces
```

Logs emitted inside an active span (`Effect.log*`) attach as span events.

Event-loop stalls (>2 s) write `server.eventLoop.stall` spans and append to `event-loop-stalls.ndjson` beside the trace file. SQLite spans carry `db.connection` (`writer`/`reader`) and `db.lock_wait_ms` (queue wait off the event loop—subtract it before blaming query speed). Metrics are kept in process.

- **Trace tuning:** `VIBECODINGER_TRACE_FILE`, `VIBECODINGER_TRACE_MAX_BYTES`, `VIBECODINGER_TRACE_MAX_FILES`, `VIBECODINGER_TRACE_MIN_LEVEL`, `VIBECODINGER_TRACE_TIMING_ENABLED`.
- **Instrumentation rules:** Trace operation boundaries via `Effect.fn("Service.operation")` (see [Effect services](../internals/02_effect-services.md)). Put high-cardinality IDs/paths on span attributes, never on metric labels.

## Heap snapshots

On macOS and Linux (not Windows), send `SIGUSR2` to the server PID from `server-runtime.json` (in the server's state dir beside `logs/`) to write `<logsDir>/server-<pid>-<timestamp>.heapsnapshot` for Chrome DevTools Memory tab:

```sh
pid="$(jq .pid "${VIBECODINGER_HOME:-$HOME/.vibecodinger}/userdata/server-runtime.json")"
ps -p "$pid" -o command=   # verify it is the VibeCodinger server—never signal desktop or launcher
kill -USR2 "$pid"
```

- Writing pauses the server (up to a minute+ on large heaps) and needs roughly as much free RAM as the heap—send once, and avoid on a swapping host.
- Snapshots contain tokens, secrets, and thread content. Never share them publicly, and delete them manually when finished.
