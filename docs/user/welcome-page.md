# Welcome page

The Welcome page runs on a fresh local installation to help you verify an agent, optionally import existing projects and conversations, and connect the mobile app. Only one ready agent is required to start.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
To see the page again, go to **Settings → About → Welcome page** and select
**Open**. Direct links, such as Settings, open normally before setup is done.

The hosted app at app.t3.codes does not open the page. With no computer connected,
it asks you to sign in to T3 Connect, then to install T3 Code and run
`vibecodinger connect` on your computer. From home, it adds compatible computers linked to your account and
opens the app. To add more computers later, use **Settings → Environments**.

If T3 Code cannot confirm the workspace during startup, it shows
**Still connecting** instead of opening the app. Select **Reload** to try again.

If T3 Code cannot read your saved settings, it shows **Could not read settings**.
Select **Retry** after storage becomes available. Setup does not replace
unreadable settings with defaults.
=======
- Reopen it anytime from **Settings → About → Welcome page → Open**.
- Hosted `app.t3.codes` skips this page and prompts you to sign in to T3 Connect and run `t3 connect` on your computer instead.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

## Agents

T3 Code lists detected agents first (ready ones on top), followed by **Add more agents** for all other supported providers:

- **Turn on**: Enables a disabled provider and checks its install and sign-in status.
- **Claude Code**: **Install** or **Sign in** opens a setup terminal using the vendor's installer (so **Update now** keeps working in Settings).
- **Codex**: **Set up** offers ChatGPT sign-in or your existing Codex CLI.
- **Outdated or other agents**: **Update** or selecting the agent opens its page in **Settings → Providers**. **Browse** opens the ACP Registry.
- **Desktop CLI**: Click **Add to PATH** if the `t3` command isn't yet on your shell `PATH`.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
On the desktop app, when the folder of the `vibecodinger` command is not on your `PATH`,
**Add to PATH** adds one line to your shell's startup file.

The setup terminal uses the home directory and environment configured for the
provider instance. Sensitive values remain redacted in Settings and
terminal metadata while the terminal process can use them.

**Start** waits for one ready agent. Select **Start without an agent** to finish
without one. Checked projects are still imported.
=======
Click **Start** once at least one agent is ready, or **Start without an agent** to enter the app immediately (checked projects still import).
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

## Phone

Select **Set up** to scan the QR code for iOS or Android, then sign in to T3 Connect on both devices. If T3 Connect is unavailable or disabled by policy, pair with a code from **Settings → Sharing & access**.

## Projects and conversation import

T3 Code scans directories used by Claude Code, Codex, and Pi (turn on Pi under **Add more agents** to include Pi sessions).

- Git repositories active in the last 30 days with at least three conversations are pre-selected (excluding already-added projects, Codex scratch directories, and `Downloads`). Use **Review all** to customize the selection.
- Conversations active in the last 30 days are imported so you can continue them in T3 Code.

### Import limits

Conversation import is best-effort:

- Keeps the first user prompt and the most recent visible user/assistant messages (up to 200 messages total), omitting tool activity and attachments.
- Skips malformed/empty sessions, files over 4 GiB, sessions over 32 MiB of kept text/metadata, or sessions with over 100,000 records.
- Each import pass reads up to 100 conversations and 4 GiB per project. Reopen the Welcome page and select the project in **Review all** to continue importing a larger batch; already-imported conversations are skipped.
