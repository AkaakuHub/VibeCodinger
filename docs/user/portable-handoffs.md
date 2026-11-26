# Context in portable handoffs

When you switch providers mid-thread, continue after a portable restart, or fork a thread the provider cannot resume natively, T3 Code transfers a budgeted selection of conversation history to the new provider session.

## What transfers

- Short conversations transfer intact.
- Longer conversations prioritize the original request, recent user/assistant turns (including partial work from interrupted turns), and key activity like command outcomes.
- Your new prompt is never shortened to make history fit.
- Codex receives historical messages directly when supported; other providers receive attributed conversation context.
- Reasoning traces, raw tool-call state, and attachments are not copied.
- Omitted history is referenced so the agent can retrieve saved messages on demand using T3 Code's thread-reading tool. Still, repeat any critical constraint in your next message if you want to be sure.

## Context limits and configuration

If the target session doesn't have enough context room, T3 Code automatically starts a fresh provider session with a bounded history selection and sends your request—no manual `/compact` needed. If your request and attachments alone exceed the model's window, shorten the message or choose a larger-context model.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
A handoff must leave room for existing provider context, your request and attachments, instructions,
tools, and subsequent work. If the target conversation has no room for the handoff, T3 Code starts
a fresh provider conversation with a bounded selection of saved history and sends your request
automatically. You do not need to compact manually. If the request and attachments leave too little
room even in a fresh conversation, shorten the request or select a larger-context model. T3 Code
never shortens your request to make it fit.

Recovery leaves running background work intact. Let it finish or stop it before retrying the handoff.

Server operators can set `VIBECODINGER_CONTEXT_HANDOFF_TOKEN_CAP` to change the initial history allowance
(default 16,000; clamped to 1,024–64,000). This is an upper bound, not a provider context-window
guarantee. Text accounting conservatively charges one token per UTF-8 byte, including attribution
and JSON escaping. Imported history has a separate 64,000-byte ceiling; your current input and
attachment payloads do not consume that ceiling.

T3 Code uses available capacity information for your selected model and options, together with
provider context telemetry. Starting a fresh provider conversation clears prior usage, while keeping
known model capacity. Changing models or context-window options discards stale usage and compaction
thresholds.

When no capacity information is available, T3 Code assumes a 128,000-token window. It reserves at
least 16,000 tokens, or a quarter of the window when larger, for instructions, tools, and subsequent
work. Images reserve an estimated 8,192 tokens each, independent of their file size; other
attachments reserve 4,096 each for their references. Existing context is estimated from saved
activity when usage telemetry is unavailable. Known smaller windows still constrain the handoff.
These are fallback estimates, not exact token counts. Image resolution, custom models, and hidden
native context can differ, so the provider may still reject an input.
=======
- **History budget**: Operators can set `T3CODE_CONTEXT_HANDOFF_TOKEN_CAP` (default `16000`, range `1024`–`64000`) to adjust the initial history allowance. Imported history has a separate 64,000-byte ceiling.
- **Fallback estimates**: When a model doesn't report capacity, T3 Code assumes a 128,000-token window, reserves at least 16,000 tokens (or 25%) for instructions/tools/work, and conservatively estimates 1 token per UTF-8 byte, 8,192 tokens per image, and 4,096 tokens per other attachment.
- Running background work stays intact during recovery—let it finish or stop it before retrying a handoff.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432
