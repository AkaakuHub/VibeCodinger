# Projects with several repositories

A single T3 Code project can span multiple Git repositories so one thread can read and edit all of them. This supports:

- A plain folder containing multiple repositories (e.g. `shop/api` and `shop/web`)
- A repository paired with external sibling repositories anywhere on disk
- A repository with Git submodules

The project folder itself does not need to be a Git repository.

## Discovery and configuration

T3 Code automatically discovers every Git repository inside the project folder—one level down, plus one level deeper inside non-repo folders (such as `src/` or `packages/`). Cloned or deleted repos update automatically; worktrees of other repos are ignored. View covered repos in **Settings → Projects → Repositories**.

**Settings → Projects → Repositories** shows what the project covers on each machine.

### Folders outside the project

A repository somewhere else on the machine has to be added, because adding it lets agents work in a
place they could not reach before.

- On web and desktop, use **Add folder** under **Repositories**.
- If the project folder has a `.code-workspace` file, the folders it lists outside the project are
  offered there with an **Add** button, on mobile too.
- From a script, `vibecodinger project add <path> --track <folder>` adds one.

**Remove** takes an added folder out of the project. It never deletes files. Added folders are
paths on one machine, so the same project on another machine has its own. A project can cover up to
128 folders.

### Leave a repository out

To keep a repository inside the project folder out of the project, name it in the `vibecodinger.json` in the
project folder, relative to that folder:

```json
{
  "ignoreRepositories": ["vendor/big"]
}
```

- **Submodules**: Checked out automatically when creating a worktree. If checkout fails, run `git submodule update --init` in the thread folder. Modified submodules appear as their own repository for diffs and Git actions, while the parent shows the updated pin.

## Review, commit, and open pull requests

- **Turn diffs**: Each turn groups changed files by repository. In the Diff pane (web/desktop), **Uncommitted**, **Changes**, and **Commits** read one repository at a time via the repository picker. See [Review turn changes](./source-control.md#review-turn-changes).
- **Git actions**: Commit, push, and PR actions run per repository—expand a repository in the thread details panel (web/desktop) or open **Git controls** (mobile). Use **Other repositories…** to include untouched repos. PRs link under their own repository.

## Worktree threads

**New worktree** creates a thread folder matching the project layout, giving each selected repository its own worktree on the thread's branch.

- Choose repositories from the repositories control next to the workspace picker before sending (all repos are selected by default when there are 8 or fewer; none when more; repos with no commits are excluded).
- Add more repositories to a running thread from **Other repositories…** (web/desktop) or the mobile Git sheet.
- Each repository branches from the thread's base branch if it has one, otherwise its own default branch.
- In a plain project folder, files outside repositories are linked (shared) rather than copied—editing them affects all threads.

### Custom worktree layout

In a plain folder, the files outside your repositories are shared links to the originals, not
copies. Editing one changes it for every thread.

### Lay the folder out yourself

If the default layout does not suit your project, for example because build output must be per
thread, workspace metadata has to be generated, or submodules need preparing, the project can
create the folder with its own command. Add this to the `vibecodinger.json` in the project folder:

```json
{
  "worktreeLayout": {
    "create": "./scripts/new-workspace.sh",
    "remove": "./scripts/remove-workspace.sh"
  }
}
```

`create` runs in the project folder (10-minute timeout, serialized per project) with these environment variables:

| Variable                             | Value                                                      |
| ------------------------------------ | ---------------------------------------------------------- |
| `VIBECODINGER_PROJECT_ROOT`          | The project folder.                                        |
| `VIBECODINGER_WORKTREE_ROOT`         | The empty folder to fill for this thread.                  |
| `VIBECODINGER_WORKTREE_PROJECT_PATH` | Where the project folder goes inside it.                   |
| `VIBECODINGER_WORKTREE_BRANCH`       | The thread's branch name.                                  |
| `VIBECODINGER_WORKTREE_BASE`         | The base branch, or empty when the thread has none.        |
| `VIBECODINGER_WORKTREE_REPOSITORIES` | The repositories chosen for the thread, one path per line. |

Requirements for layout scripts:

- Create linked worktrees on `T3_WORKTREE_BRANCH` via `git worktree add` (clones or other branches are rejected).
- `create` must be idempotent (if re-run when a folder is missing, check out the existing branch). Failed `create` runs roll back created checkouts.
- `remove` (optional) runs before T3 Code cleans up and should handle partially missing folders and delete generated files.

- **Checkouts are linked worktrees on the thread's branch.** Make each one with
  `git worktree add` from the repository it belongs to, on `VIBECODINGER_WORKTREE_BRANCH`. T3 Code later
  removes, restores, and renames these through Git, so it refuses a clone or a checkout on another
  branch and the thread does not start.
- **`create` can run more than once.** It runs again when a thread's folder has gone missing, by
  which time the branch already exists. Check the branch out when it is there and create it
  otherwise.
- **`remove` can run on a folder that is partly gone**, such as after a failed `create` or an
  earlier cleanup. Storage cleanup never deletes files that exist only in the thread's folder, so
  `remove` should delete what `create` generated.
- **A failed `create` is rolled back.** Checkouts it already made are removed.
- **One command runs at a time per project**, so a command can update a shared file in the project
  folder without its own locking.
- **Each command has ten minutes.**
- **The commands run only for requests that may run commands on the host.** A client paired
  without `orchestration:operate` and `terminal:operate`, and a thread started through a
  [linked environment](remote-access.md#link-another-environment) paired below full access, get no worktree in a project
  that declares a layout, and their cleanup leaves `remove` out.

A project with no other repository can declare a layout too. This example gives each thread
a worktree with its submodules checked out. The command runs in `sh`, and in `cmd.exe` on Windows,
so write it for the shell of the machine the project is on; this one is for `sh`:

```json
{
  "worktreeLayout": {
    "create": "(git worktree add \"$VIBECODINGER_WORKTREE_PROJECT_PATH\" \"$VIBECODINGER_WORKTREE_BRANCH\" 2>/dev/null || git worktree add -b \"$VIBECODINGER_WORKTREE_BRANCH\" \"$VIBECODINGER_WORKTREE_PROJECT_PATH\" ${VIBECODINGER_WORKTREE_BASE:-HEAD}) && git -C \"$VIBECODINGER_WORKTREE_PROJECT_PATH\" submodule update --init"
  }
}
```

#### Command approval and security

T3 Code prompts you to approve the exact `create` and `remove` command strings on web/desktop before running them (manage approvals in **Settings → Projects → Worktree layout**; requires `terminal:operate`). Approvals are stored per environment and invalidated if the command string in `t3.json` changes.

- Unapproved commands block worktree creation from mobile, scheduled tasks, and agents.
- Agents can never approve commands and must be in **Full access** to trigger `worktreeLayout` or worktree-creation setup scripts.
- Administrators can disable layout commands with [`worktreeLayoutCommands`](./managed-policy.md#other-capabilities).

## Rewind and limits

- One Git action runs in one repository. There is no commit or push across several at once.
- Only the project folder's `vibecodinger.json` is read. Setup scripts and actions inside one of its
  repositories are not picked up.
- The Diff pane's repository picker and the base branch field for a plain folder are on web and
  desktop only.
