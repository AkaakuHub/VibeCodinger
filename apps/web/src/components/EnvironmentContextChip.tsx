import {
  type EnvironmentContextRecord,
  resolveEnvironmentMachineKind,
} from "@vibecodinger/contracts";

import { useGT } from "gt-react";

import { useEnvironment } from "~/state/environments";
import { ContextChip, ContextChipLabel } from "./ContextChip";
import { EnvironmentMachineIcon } from "./EnvironmentMachineIcon";
import { SharedTooltipTrigger } from "./ui/shared-tooltip";

/**
 * Inline chip for a mentioned machine, in the composer and in sent messages. Prefers the
 * name this client knows the machine by, and draws it with its machine icon.
 */
export function EnvironmentContextChip(props: {
  record: Pick<EnvironmentContextRecord, "environmentId" | "label">;
  copyMarkdown?: string;
}) {
  const gt = useGT();
  const environment = useEnvironment(props.record.environmentId);
  const label = environment?.label.trim() || props.record.label;
  return (
<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
    <Tooltip>
      <TooltipTrigger
        render={
          <ContextChip
            kind="environment"
            tabIndex={0}
            aria-label={gt("Machine, {label}", { label })}
            data-markdown-copy={props.copyMarkdown}
          >
            <EnvironmentMachineIcon
              kind={resolveEnvironmentMachineKind(environment?.serverConfig ?? null)}
            />
            <ContextChipLabel>{label}</ContextChipLabel>
          </ContextChip>
        }
      />
      <TooltipPopup side="top">
        {environment ? gt("VibeCodinger environment") : gt("Machine not in this app")}
      </TooltipPopup>
    </Tooltip>
=======
    <SharedTooltipTrigger
      render={
        <ContextChip
          kind="environment"
          tabIndex={0}
          aria-label={gt("Machine, {label}", { label })}
          data-markdown-copy={props.copyMarkdown}
        >
          <EnvironmentMachineIcon
            kind={resolveEnvironmentMachineKind(environment?.serverConfig ?? null)}
          />
          <ContextChipLabel>{label}</ContextChipLabel>
        </ContextChip>
      }
      label={environment ? gt("T3 Code environment") : gt("Machine not in this app")}
    />
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432
  );
}
