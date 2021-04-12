import { OpenPeerPower } from "../types";
import { showToast } from "./toast";

export const showSaveSuccessToast = (el: HTMLElement, opp: OpenPeerPower) =>
  showToast(el, {
    message: opp!.localize("ui.common.successfully_saved"),
  });
