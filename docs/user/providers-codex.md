# Codex

Use your ChatGPT plan or an existing Codex CLI login to run Codex in T3 Code.

## Connect with ChatGPT

Connect during onboarding or in **Settings → Providers** (select your target environment first for remote machines). T3 Code manages the Codex runtime and signs you in via OpenAI.

- Manage shared usage and credits through **Manage usage** in T3 Code.
- **Remote sign-in**: If sign-in doesn't return automatically, paste the full `localhost` redirect URL into the sign-in panel.
- **Speed options**: Fast and Ultrafast speeds are not available through ChatGPT sharing—[use an existing Codex login](#use-an-existing-codex-login) instead.
- Disconnecting stops running threads while preserving history.

## Use an existing Codex login

Run `codex login` on the environment's machine, then add a Codex instance in **Settings → Providers** via **Configure manually**. See [provider setup](./install.md#providers) for installation details.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Running `codex login` does not change a managed ChatGPT connection. In
**Settings > Providers**, add a Codex instance, choose **Configure manually**,
and complete the wizard. Then select that instance from the thread's model
picker. See [Use multiple accounts](#use-multiple-accounts).

## Allow more time for provider checks

If an authenticated Codex installation reports “Timed out while checking Codex
app-server provider status,” set `VIBECODINGER_CODEX_PROBE_TIMEOUT_MS=60000` in the
VibeCodinger server's environment and restart it. See [Provider check timeouts](./install.md#provider-check-timeouts)
for configuration and other providers.

## Generate images

Codex can generate images directly in a T3 Code thread when your Codex version,
model, and account support native image generation.

If Codex reports that its image tool is unavailable, image generation may be
disabled in its configuration. In **Settings → Providers**, edit your existing
Codex provider and add this to **Launch arguments**, keeping any other arguments:

```text
-c features.image_generation=true
```

This enables the feature for that T3 Code provider without changing your shared
Codex configuration. You do not need another provider instance or a separate image
API key. The flag does not add image support to an unsupported model or account.

Launch arguments apply to Codex sessions started after you save them. Start a new
thread with the same Codex provider and ask it to generate an image. The completed
image appears in the thread.
=======
If provider status checks time out on a slower machine, set `T3CODE_CODEX_PROBE_TIMEOUT_MS=60000` in the server environment and restart. See [Provider check timeouts](./install.md#provider-check-timeouts).
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

## Use multiple accounts

Add another ChatGPT account in **Settings → Providers**, or configure multiple CLI logins with a **shadow home** so work and personal accounts can continue the same threads:

```bash
mkdir -p ~/.codex_personal
CODEX_HOME=~/.codex_personal codex login
```

| Instance       | CODEX_HOME path | Shadow home path    |
| -------------- | --------------- | ------------------- |
| Codex Work     | `~/.codex`      | _(leave empty)_     |
| Codex Personal | `~/.codex`      | `~/.codex_personal` |

- Both instances must share the same **CODEX_HOME path**. Keep the shadow directory fresh—don't copy your full Codex home into it.
- The shadow account needs file-based credential storage (`auth.json`); see [OpenAI's credential storage guide](https://learn.chatgpt.com/docs/auth#credential-storage).
- Use a separate **CODEX_HOME path** (no shadow home) if you want completely isolated sessions.

To switch accounts mid-thread, pick another compatible Codex instance sharing the same **CODEX_HOME path** from the model picker.

## Features and options

- **Image generation**: Supported when your Codex version, model, and account allow it. If disabled in Codex config, add `-c features.image_generation=true` to the instance's **Launch arguments** (applies to new sessions).
- **Async questions**: Codex can ask a question while continuing to work; answer in the question panel (steers the active turn or starts a new one) or dismiss it without sending.
- **App access approvals**: Respond to external app access requests directly in chat (one-time, session, or permanent depending on the tool).
- **MCP OAuth sign-in**: Click **Sign in** on the thread notice, approve in your browser, and paste the final redirect URL into **Finish sign-in** (requires provider management permission).
- **Daybreak**: Models with cyber access programs show a **Cyber Access** option (`Standard` or `Daybreak`, initialized from `daybreak = true` in `config.toml`).
- **Usage limits**: Limit stops display the exhausted window, reset time, and (on workspace plans) whether credits or spend limits need adjustment.
- **Feedback to OpenAI**: Send `/feedback <description>` in an existing Codex thread to upload conversation and Codex logs to OpenAI.

## OpenAI Chrome extension

Using your signed-in Chrome profile via [OpenAI's Chrome extension](https://learn.chatgpt.com/docs/chrome-extension) requires a browser connection for the Codex thread. For remote environments, forward the remote page's port or use a reachable URL—T3 Code's built-in preview browser uses its own separate session.
