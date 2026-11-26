import { useAtomValue } from "@effect/atom-react";
import { errorDisplayMessage } from "@vibecodinger/client-runtime/errors";
import {
  type AtomCommandResult,
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@vibecodinger/client-runtime/state/runtime";
import {
  AuthOrchestrationOperateScope,
  type ChatAttachment,
  type ScopedThreadRef,
  type ThreadGuestMessage,
  type ThreadGuestShare,
} from "@vibecodinger/contracts";
import { Atom } from "effect/reactivity";
import { msg, useGT } from "gt-react-native";
import { type ReactNode, useMemo, useState } from "react";
import { View } from "react-native";

import { Button } from "../../components/ui/Button";
import { AppText as Text } from "../../components/ui/AppText";
import * as Dialog from "../../components/ui/Dialog";
import { m } from "../../i18n/messages";
import { useEnvironmentScope } from "../../state/session";
import { environmentThreadDetails, threadEnvironment } from "../../state/threads";
import { useAtomCommand } from "../../state/use-atom-command";
import { GUEST_PENDING_BUBBLE_CLASS_NAME, GuestMessageName } from "./guestMessageStyle";

const NO_GUEST_SHARE_ATOM = Atom.make<ThreadGuestShare | null>(null);

function guestShareAtom(ref: ScopedThreadRef) {
  let previous: ThreadGuestShare | null = null;
  return Atom.make((get) => {
    const next =
      get(environmentThreadDetails.threadAtom(ref))?.projection.thread.guestShare ?? null;
    // The thread record is replaced on unrelated updates; only share changes matter here.
    if (JSON.stringify(next) !== JSON.stringify(previous)) previous = next;
    return previous;
  });
}

export function useThreadGuestShare(threadRef: ScopedThreadRef | null): ThreadGuestShare | null {
  const shareAtom = useMemo(
    () => (threadRef === null ? NO_GUEST_SHARE_ATOM : guestShareAtom(threadRef)),
    [threadRef],
  );
  return useAtomValue(shareAtom);
}

function alertOnFailure(failureTitle: string, result: AtomCommandResult<unknown, unknown>) {
  if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
    const error = squashAtomCommandFailure(result);
    Dialog.alert(failureTitle, errorDisplayMessage(error, m) ?? m(msg("Try again.")));
  }
}

/**
 * One guest message waiting at the end of the feed until the owner sends or dismisses it. Sent
 * ones then show in the feed as user messages with the guest's name.
 */
export function ThreadGuestPendingMessage(props: {
  readonly threadRef: ScopedThreadRef;
  readonly guestName: string;
  readonly message: ThreadGuestMessage;
  readonly bubbleMaxWidth: number | `${number}%`;
  /** The feed's own attachment rendering, so the owner sees the files before Send. */
  readonly renderAttachments: (attachments: ReadonlyArray<ChatAttachment>) => ReactNode;
}) {
  const { threadRef, guestName, message } = props;
  const gt = useGT();
  const canOperate = useEnvironmentScope(threadRef.environmentId, AuthOrchestrationOperateScope);
  const resolveGuestMessage = useAtomCommand(
    threadEnvironment.resolveGuestMessage,
    "resolve guest message",
  );
  // One request at a time: a second tap while the first is in flight would double-send.
  const [busy, setBusy] = useState(false);

  const resolve = async (decision: "send" | "dismiss") => {
    if (busy) return;
    setBusy(true);
    const result = await resolveGuestMessage({
      environmentId: threadRef.environmentId,
      input: {
        threadId: threadRef.threadId,
        guestMessageId: message.id,
        decision,
        creationSource: "mobile",
      },
    });
    setBusy(false);
    alertOnFailure(
      decision === "send"
        ? gt("Could not send guest message")
        : gt("Could not dismiss guest message"),
      result,
    );
  };

  return (
    <View className="items-end pb-5">
      <GuestMessageName name={guestName} />
      <View className={GUEST_PENDING_BUBBLE_CLASS_NAME} style={{ maxWidth: props.bubbleMaxWidth }}>
        {message.text ? (
          <Text selectable className="text-base text-foreground">
            {message.text}
          </Text>
        ) : null}
        {props.renderAttachments(message.attachments ?? [])}
      </View>
      {canOperate ? (
        <View className="mt-1.5 flex-row gap-2">
          <Button
            label={gt("Dismiss")}
            tone="secondary"
            accessibilityLabel={gt("Dismiss message from {guestName}", { guestName })}
            disabled={busy}
            onPress={() => void resolve("dismiss")}
          />
          <Button
            label={gt("Send", { $context: "verb, button" })}
            tone="primary"
            accessibilityLabel={gt("Send message from {guestName}", { guestName })}
            disabled={busy}
            onPress={() => void resolve("send")}
          />
        </View>
      ) : null}
    </View>
  );
}
