import type { LitElement } from "lit";
import {
  OppioAddonDetails,
  restartOppioAddon,
} from "../../../src/data/oppio/addon";
import { extractApiErrorMessage } from "../../../src/data/oppio/common";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../src/dialogs/generic/show-dialog-box";
import { OpenPeerPower } from "../../../src/types";

export const suggestAddonRestart = async (
  element: LitElement,
  opp: OpenPeerPower,
  supervisor: Supervisor,
  addon: OppioAddonDetails
): Promise<void> => {
  const confirmed = await showConfirmationDialog(element, {
    title: supervisor.localize("common.restart_name", "name", addon.name),
    text: supervisor.localize("dialog.restart_addon.text"),
    confirmText: supervisor.localize("dialog.restart_addon.confirm_text"),
    dismissText: supervisor.localize("common.cancel"),
  });
  if (confirmed) {
    try {
      await restartOppioAddon(opp, addon.slug);
    } catch (err) {
      showAlertDialog(element, {
        title: supervisor.localize(
          "common.failed_to_restart_name",
          "name",
          addon.name
        ),
        text: extractApiErrorMessage(err),
      });
    }
  }
};
