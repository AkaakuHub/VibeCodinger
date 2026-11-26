import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { CLI_RELEASES_PAGE_URL, releaseAssetUrl } from "@vibecodinger/shared/cliRelease";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { AsyncResult, Atom } from "effect/reactivity";
import { useGT } from "gt-react-native";

import * as Dialog from "../../../components/ui/Dialog";
import { tryOpenExternalUrl } from "../../../lib/openExternalUrl";
import { findReleaseUpdate } from "../../updates/release-updates";
import { SettingsRow } from "./SettingsRow";

class ForkReleaseCheckError extends Schema.TaggedError<
  ForkReleaseCheckError,
  { readonly brand: unique symbol }
>()("ForkReleaseCheckError", { cause: Schema.Defect() }) {}

const releaseCheckAtom = Atom.family((version: string) =>
  Atom.make(
    Effect.tryPromise({
      try: (signal) => findReleaseUpdate(version, signal),
      catch: (cause) => new ForkReleaseCheckError({ cause }),
    }).pipe(Effect.timeout("20 seconds")),
  ),
);

export function ForkReleaseUpdateRow({ version }: { readonly version: string }) {
  const gt = useGT();
  const release = useAtomValue(releaseCheckAtom(version));
  const refresh = useAtomRefresh(releaseCheckAtom(version));
  const checking = release.waiting || AsyncResult.isInitial(release);

  const target = AsyncResult.isSuccess(release) ? release.value : null;
  if (!checking && target !== null) {
    return (
      <SettingsRow
        icon="arrow.up.right"
        label={gt("Update ready")}
        value={target}
        onPress={() => {
          void tryOpenExternalUrl(releaseAssetUrl(CLI_RELEASES_PAGE_URL, "tag", `v${target}`)).then(
            (opened) => {
              if (!opened) Dialog.alert(gt("Update failed"));
            },
          );
        }}
      />
    );
  }
  return (
    <SettingsRow
      icon="arrow.down.circle"
      label={gt("Check for updates")}
      value={
        checking
          ? gt("Checking…")
          : AsyncResult.isSuccess(release)
            ? gt("Up to date")
            : gt("Update failed")
      }
      disabled={checking}
      onPress={refresh}
    />
  );
}
