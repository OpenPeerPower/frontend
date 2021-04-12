import { ShowToastParams } from "../managers/notification-manager";
import { OpenPeerPower } from "../types";
import { showToast } from "./toast";

export const showDeleteSuccessToast = (
  el: HTMLElement,
  opp: OpenPeerPower,
  action?: () => void
) => {
  const toastParams: ShowToastParams = {
    message: opp!.localize("ui.common.successfully_deleted"),
  };

  if (action) {
    toastParams.action = { action, text: opp!.localize("ui.common.undo") };
  }

  showToast(el, toastParams);
};
