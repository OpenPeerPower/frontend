import { fireEvent } from "../../common/dom/fire_event";

const loadVoiceCommandDialog = () => import("./op-voice-command-dialog");

export const showVoiceCommandDialog = (element: HTMLElement): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "op-voice-command-dialog",
    dialogImport: loadVoiceCommandDialog,
    dialogParams: {},
  });
};
