# Devices

Stream and interact with live iOS Simulators, Android Emulators, and physical Android devices right beside a thread, and let agents inspect and drive them via `device_*` tools and the `agent-device` CLI.

## Open a device

Open the right panel in a project thread and choose **Device** (first-time setup starts the device hub, checks iOS/Android tools, and asks whether agents may control devices).

- Start a stopped device or attach to a running one; open additional devices via **+ → Device**.
- Click, drag, and type directly on the live screen; use the toolbar for Home, Back, Recents, rotate, power off, **3D view** (and fold/unfold on foldables), **Tools**, or **Float device over chat**.
- **Tools drawer**: Inspect the foreground app, toggle dark mode, text size, accessibility overlays, mock location, app permissions, iOS VoiceOver / test push notifications, and Android orientation / network toggles.
- Closing a tab stops streaming without powering off the device. Turn off **Settings → Devices → Use devices** to stop helper processes.

## Host prerequisites

Devices run on the environment's server machine (or an SSH/Simlock device host):

- **iOS Simulators**: macOS with Xcode.
- **Android Emulators**: Android SDK Platform-Tools, Android Emulator, Command-line Tools (latest), an AVD created in Android Studio, and `ffmpeg` with `libx264` on `PATH` (or `SERVE_EMU_FFMPEG`). Set `ANDROID_HOME` for custom SDK paths.
- **Physical Android devices**: SDK Platform-Tools only (no `ffmpeg`). Enable **USB debugging** (and **USB debugging (Security settings)** on Xiaomi devices), or pair wirelessly via `adb pair <addr>:<pairing-port>` then `adb connect <addr>:<port>`.

Restart the environment server after installing SDK tools or changing `PATH` / `SERVE_EMU_FFMPEG`.

## Agents and devices

Enable **Settings → Devices → Agents can use devices** so agents can drive devices through `agent-device` (restart existing agent sessions after enabling). First iOS tap builds a small test runner once per server (~2 minutes).

When an agent opens a device, it floats over chat by default (disable **Settings → Browser → Auto-show floating preview** to open in the right panel instead). On mobile, tap the device button above the composer to watch and interact.

## Remote connections

Device video streams through the environment server (works over LAN, Tailscale, and T3 Connect). Live video requires HTTPS or `localhost`—plain HTTP remote origins fall back to still images on iOS and disable video on Android (except Expo Simulators).

## SSH device hosts

Use simulators/emulators on another macOS or Linux machine (e.g., a Mac build host from Linux/Windows):

1. Open **Settings → Devices → Add source → Machine over SSH** and enter an SSH alias or `user@host` (uses the environment server's SSH config/keys; no password prompts).
2. Run **Test connection** to verify SSH, Node.js 22.12+, npm, and SDK tools (Android on SSH hosts requires full SDK tools + `ffmpeg` for emulators).
3. First listing installs pinned device helpers on the SSH host.

> Note: Remote simulators cannot reach `localhost` dev servers (like Metro) on your main host without port forwarding or a reachable network address.

## Simlock hosts (alpha)

Connect to a [Simlock](https://incubator.callstack.com/simlock/) device pool (requires Simlock 0.9.0 or later with `capabilities.stream.enabled` and `capabilities.input.enabled`):

<<<<<<< 7fa8be15bd9b767bd51bc62484531cfe73d3a751
Turn on **Settings → Labs → Simlock device hosts (alpha)** and **Use devices**
in Settings → Devices, then choose **Add source → Simlock pool** with an **agent token**
(`simlock --gateway token create --role agent`). Give each VibeCodinger server its own
token: Simlock counts every lease made with one token against the same
requester, and allows one at a time unless the gateway's
`lease.maxPerRequester` is raised to the host's **Devices at once**. The token
leases devices and reaches only its own leases, but commands on a leased device
run on its worker, so treat it like shell access to your workers. T3 sends it
with every request, so use an HTTPS gateway URL, or plain HTTP only over an
encrypted network such as Tailscale. The gateway
and workers need `capabilities.stream.enabled` and `capabilities.input.enabled`
for the live screen and for input.

The picker lists the models your workers can make. Opening one takes a lease;
closing it with **Return device to the pool**, or removing the host, returns it
wiped. The panel keeps a watched device leased up to the host's lease limit.
You can tap, swipe, type, and press Home, and Back and Recents on Android.
Rotation, appearance, text size, device tools, and screenshots are not offered
for Simlock devices; agents can still do them through `device_open`. On iOS 27
simulators, typing on your keyboard does nothing; tap the on-screen keyboard
instead. Workers must run the same agent-device
version as T3 (see Device tool updates), and agent-device accepts app installs
for a lease only from the folder it was opened from, which `device_open`
names. A device cannot reach development servers on your machine through
localhost; use an address its worker can reach.
=======
1. Enable **Settings → Labs → Simlock device hosts (alpha)** and **Settings → Devices → Use devices**.
2. Choose **Add source → Simlock pool** with an agent token (`simlock --gateway token create --role agent`) over HTTPS or Tailscale (give each T3 server its own token; treat it like worker shell access).
3. Closing a device with **Return device to the pool** releases the lease; simulators and emulators are wiped. Toolbar tools/rotation/screenshots are unavailable in the UI (agents can still invoke them via `device_open`).

### Enrolled phones and tablets

The enrolled phones and tablets that are ready on a connected, undrained worker appear in the list next to its simulators and emulators, marked **Physical**, one entry per model and OS version. Worker setup is covered in Simlock's [Use a real phone](https://incubator.callstack.com/simlock/docs/using-devices/agent-device#use-a-real-phone).

- A phone is not wiped when its lease ends. Simlock removes apps that weren't on the phone when it was enrolled, except App Store and TestFlight apps on an iPhone; settings, files, accounts, keychain items, and the data of every other app stay for whoever leases it next.
- A leased phone has no stop button in the device list. Open it and choose **Return device to the pool**.
- An iPhone's screen needs iOS 27 or later and a worker on Xcode 27 or later, and it takes no clicks or typing from the panel. Agents can still drive it.
>>>>>>> ab1915b658e54d665e29fef824087a41186706cd

## Device tool updates

The connected VibeCodinger server manages the device hub and agent tools on its own machine and configured SSH hosts. Required versions install automatically the next time those tools are used. In Settings → Devices, select a version and choose **Check versions** to read installed versions without installing tools or starting devices.

To receive newer tool versions on a remote environment, update that environment's VibeCodinger server. Updating only the browser or mobile app does not update the remote server. An offline host keeps its installed files, but an update needs network access before device support can start; T3 does not fall back to an older version. Reconnect the host and use Retry if installation fails. Existing device and agent-access settings are preserved.
