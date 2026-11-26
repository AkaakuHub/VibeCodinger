# Running VibeCodinger in the background

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
On Linux, macOS, and Windows, VibeCodinger can run as a service for your user so you
do not need to keep a terminal open.

## Manage the service

Install the `vibecodinger` CLI first ([Install VibeCodinger](./install.md#command-line)), then
run these commands on the machine that will host VibeCodinger:

| Task                                  | Command                          |
| ------------------------------------- | -------------------------------- |
| Set up access from your other devices | `vibecodinger up`                |
| See how your other devices reach it   | `vibecodinger status`            |
| Install and start                     | `vibecodinger service install`   |
| Inspect status and log location       | `vibecodinger service status`    |
| Move to a newer release               | `vibecodinger update`            |
| Restart                               | `vibecodinger service restart`   |
| Stop and remove from startup          | `vibecodinger service uninstall` |

Uninstalling the service leaves your projects, threads, and settings intact.
Running `vibecodinger service install` again repairs a service that `vibecodinger service status`
reports as broken.

`vibecodinger update` downloads the newest release on your channel and switches `vibecodinger`
and the service to it. Restarting interrupts running agent turns, terminals,
and remote clients, so it asks first; answer no and the service keeps running
the old version until you run `vibecodinger service restart`. Pass `--yes` from a
script. A server you started by hand is left running; stop and start it again
to pick up the new version. Wait for any remote update already in progress
before updating; to match a remote client's version, follow
[Updating VibeCodinger](./updating.md).

Pass an exact version (`vibecodinger update 0.0.42`) to pin one, `--channel nightly` to
switch trains, or `--allow-downgrade` to move backwards. `preview` is a
maintainers' test train: its builds can be broken and are never offered as
updates, so the installer and `vibecodinger update` ask for confirmation before
installing one.

`vibecodinger uninstall` removes the background service, the `vibecodinger` launcher, and the
downloaded versions after showing you the list and asking once. Your projects,
threads, and settings under `~/.vibecodinger/userdata` are kept, along with `service.env`
under VibeCodinger home. Pass `--yes` from a script.

## Local network access

A new service answers only on this machine. To connect other devices on the
tailnet, set up [direct TLS over Tailscale](./remote-access.md#direct-tls-over-tailscale).

## Configure the service environment

Put custom environment variables in `service.env` under the service's VibeCodinger home
directory, normally `~/.vibecodinger/service.env`. This file survives service installation
and updates. For example:
=======
Run T3 Code as a background user service on Linux, macOS, or Windows so your host stays reachable without keeping a terminal open.

## Manage the service

Install the `t3` CLI first ([Command line](./install.md#command-line)), then run these commands on the host machine:

| Task                                    | Command                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| Set up access from other devices        | `t3 up`                                                   |
| Check how other devices reach it        | `t3 status`                                               |
| Install and start (or repair)           | `t3 service install`                                      |
| Check status and log path               | `t3 service status`                                       |
| Update to a newer release               | `t3 update`                                               |
| Restart                                 | `t3 service restart`                                      |
| Stop and remove from startup            | `t3 service uninstall`                                    |
| Remove service, launcher, and downloads | `t3 uninstall` (keeps `~/.t3/userdata` and `service.env`) |

- Pairing codes are never written to logs; run `t3 pair` or `t3 up` on the host to connect a device.
- `t3 update` asks before restarting (pass `--yes` in scripts). Pin a version with `t3 update 0.0.42`, switch tracks with `--channel nightly`, or downgrade with `--allow-downgrade`.

## Local network access

New services bind to localhost only. Run `t3 up --lan` (sets `T3CODE_LAN=true` in `service.env`) to listen on LAN and Tailscale addresses for direct desktop/mobile connections, or `t3 up --no-lan` to disable it. Anyone on that network can reach the port (gated by pairing). `T3CODE_HOST` overrides `T3CODE_LAN`. Hosted `app.t3.codes` always uses T3 Connect.

## Configure the service environment

Add `KEY=VALUE` entries to `service.env` in your T3 home directory (`~/.t3/service.env` by default). Values are literal (quote spaces or `#`; no shell expansion) and survive installs and updates.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

```dotenv
VIBECODINGER_PORT=3773
VIBECODINGER_HOST=127.0.0.1
```

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Use `KEY=VALUE` entries, quoting values that contain spaces or `#`. Values are
literal: shell commands and variable expansion are not evaluated. Entries
override the inherited service environment, except for `PATH`, `VIBECODINGER_HOME`,
`VIBECODINGER_BOOT_SERVICE_UNIT`, and `VIBECODINGER_SERVICE_LAUNCHER_CONTEXT` (including case variants).

Run `vibecodinger service restart` after changing the file. Changes apply when the service
starts again; switching the server version alone keeps the current values.
For a service installed before env-file support, run `vibecodinger service install` once
with an up-to-date CLI.
A missing file is ignored; other read failures stop service startup.
If the file contains credentials, restrict access to that file with `chmod 600`
(for the default VibeCodinger home, `chmod 600 ~/.vibecodinger/service.env`).

## Platform support

Linux needs systemd user services. Setup enables lingering so VibeCodinger starts at
boot and keeps running after logout. If this needs administrator permission,
setup prints a recovery command before changing the service.
=======
- `PATH`, `T3CODE_HOME`, `T3_BOOT_SERVICE_UNIT`, and `T3_SERVICE_LAUNCHER_CONTEXT` cannot be overridden here.
- Run `t3 service restart` after editing (and `chmod 600 ~/.t3/service.env` if it holds secrets).

## Platform support

- **Linux**: Requires systemd user services with lingering enabled so T3 Code starts at boot and survives logout.
- **macOS**: Starts at login, stops at logout. Keep the Mac logged in and awake for unattended access. If agents can't read Desktop/Documents/Downloads, grant Full Disk Access to the `t3` path in `~/Library/LaunchAgents/com.t3tools.t3code.service.plist`.
- **Windows**: Runs windowless via Task Scheduler (`t3code-<domain>-<user>`) while signed in and auto-restarts on exit. Lock the screen instead of signing out for unattended access.
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

> Note: Signing out of T3 Connect does not stop or uninstall the background service.

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
Windows starts the service when you log in and stops it when you sign out. It
runs without a window as the `vibecodinger-<domain>-<user name>` task in Task Scheduler, and Task
Scheduler starts it again within a minute if it exits. Lock the screen instead
of signing out, and keep the PC awake, for unattended remote access. Installing
over SSH while nobody is signed in at the PC can fail at the final start step;
the service is still installed and will start at the next sign-in.

## Keep the server responsive when agents use all memory

On Linux, agents already run with lower priority than the server. When they
fill the machine's memory, though, the kernel may still slow down or stop the
server, because only an administrator can reserve memory for it. Run, as your
normal user:
=======
## Keep the server responsive under memory pressure (Linux)

On Linux, agents run at lower priority than the server, but heavy memory use can still trigger the OOM killer. Run as your normal user:
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

```sh
vibecodinger service protect
```

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
It shows the system settings it will change, asks before applying them, and
then asks for your sudo password. If the machine runs Tailscale or SSH, it
also offers to protect them, so you can still reach the machine. Memory
protection takes effect at once. The server's protection from the kernel's
out-of-memory killer takes effect after `vibecodinger service restart`. `vibecodinger service status` reports whether
the protection is in place, and `vibecodinger service protect --undo` removes it.

## Troubleshooting

Start with `vibecodinger service status` on the host. It prints the log path and, on Linux,
checks whether the installed service is running, enabled, and allowed to survive
logout.
=======
It previews system changes, asks for confirmation and `sudo`, and optionally protects Tailscale and SSH too. Run `t3 service restart` for OOM-killer protection to take effect, or `t3 service protect --undo` to remove it.

## Troubleshooting

Run `t3 service status` on the host to see the log path and health checks:
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432

| Status                                 | Fix                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `linger-disabled`                      | Run `sudo loginctl enable-linger "$(id -un)"` (or `ssh -t your-server '...'`), then retry setup as your normal user. Never run T3 Code as root. |
| `linger-unavailable`                   | Check `loginctl show-user "$(id -un)" --property=Linger` and verify `systemd-logind`.                                                           |
| `user-manager-unavailable`             | Run `systemctl --user status` in a login session to verify systemd user support.                                                                |
| `service-disabled` / `service-stopped` | Check the log and `systemctl --user status t3code.service`, then run `t3 service install`.                                                      |
| `restart-pending`                      | Run `t3 service restart` to switch to the newly installed version.                                                                              |

<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
```sh
sudo loginctl enable-linger "$(id -un)"
```

Over SSH, allow sudo to prompt:

```sh
ssh -t your-server 'sudo loginctl enable-linger "$(id -un)"'
```

Then retry service setup as your normal user. Run only the `loginctl` command
with sudo; running VibeCodinger as root creates a separate installation and Connect
identity. Without administrator access, run `vibecodinger serve` in a terminal and keep
that session open.

| Status problem                          | Next step                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `linger-unavailable`                    | Run `loginctl show-user "$(id -un)" --property=Linger` and check that systemd-logind is available.                               |
| `user-manager-unavailable`              | Run `systemctl --user status` in a login session for the service user; check your distribution's systemd user-session support.   |
| `service-disabled` or `service-stopped` | Read the log and, on Linux, `systemctl --user status vibecodinger.service`, then use the repair command printed by VibeCodinger. |
| `restart-pending`                       | A newer version is installed but the service still runs the previous one. Run `vibecodinger service restart`.                    |

On macOS, check **System Settings → General → Login Items** if the service no
longer starts at login. If agent work cannot access Desktop, Documents, or
Downloads, it may need Full Disk Access for the `vibecodinger` executable listed in
`ProgramArguments` in
`~/Library/LaunchAgents/net.akaaku.vibecodinger.service.plist`.

## Reclaim database space

VibeCodinger removes internal history older than a day on its own while it runs;
your conversations are kept. Databases created before this shrank automatically
still hold the freed space on disk until a one-time offline repair returns it
and turns on automatic shrinking. Settings > Maintenance (web and desktop) or
Settings > Maintenance (mobile) suggests the repair when at least 1 GiB can be
reclaimed.

When the desktop app or the background service runs VibeCodinger on that machine,
select **Reclaim** in Settings on web or desktop. VibeCodinger checks for free disk
space, then stops, repairs the database, and starts again. It is offline while
the repair runs, and running agents stop. If the repair fails, Settings shows
why.

In other cases, such as a server you started by hand, run `vibecodinger doctor` on the
machine that hosts the environment. It reports the database size and the
space it can reclaim, then asks which repairs to run;
pass `--fix` to run the recommended ones without a prompt (for scripts), or
`--dry-run` to only report. An installed background service for the same data
directory is stopped for the repair and started again afterwards, also when
the repair fails. Quit a server you started by hand, or the desktop app, first:
the repair refuses to touch a database that is in use, and names the server
process that holds it when it can tell. While the repair runs, a server started
for the same data directory, for example by a desktop app connecting over SSH,
is refused until the repair ends. Use `--base-dir` for a different data
directory.

The repair's time grows with the size of the whole database, not only the
space it reclaims, and can exceed an hour on a large database or a slow disk;
`vibecodinger doctor` shows each step as it runs. It rebuilds the database through a
temporary copy, so it needs free space of about twice the data still in use
(the database size minus the reclaimable space): once in the system temporary
directory (on Linux and macOS, `TMPDIR`, or `/var/tmp` when it is not set) and
once next to the database for its write-ahead log.

If you upgraded from a version before 0.1.0, its database (`state.sqlite`) is
still kept next to the current one so you can roll back. `vibecodinger doctor` offers to
delete it, but never selects that repair for you and `--fix` skips it: once it
is gone, a version before 0.1.0 starts with no threads or settings. It does
not offer to delete it while any project or thread you have not deleted is
missing from the current database, so the old file stays available for
recovery.
=======
For T3 Connect issues, see [T3 Connect troubleshooting](./t3-connect-troubleshooting.md).

## Reclaim database space

T3 Code automatically prunes old internal history while keeping conversations. Older databases that still hold freed space show a **Reclaim** button in **Settings → Maintenance** when at least 1 GiB is reclaimable (pauses the server/agents during repair).

For manually started servers (or CLI use), stop any hand-started server or desktop app and run:

```sh
t3 doctor          # Interactive repair (auto-stops/restarts a background service)
t3 doctor --dry-run
t3 doctor --fix    # Non-interactive recommended repairs
```

- Needs free disk space of ~2× active data size (in `TMPDIR`/`/var/tmp` and beside the database). Large databases can take over an hour.
- `t3 doctor` optionally offers to remove the legacy pre-0.1.0 `state.sqlite` backup only when all active projects and threads exist in the current database (`--fix` never deletes it automatically).
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432
