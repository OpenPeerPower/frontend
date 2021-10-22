import { fireEvent } from "../../common/dom/fire_event";

export interface MfaModuleSetupFlowDialogParams {
  continueFlowId?: string;
  mfaModuleId?: string;
  dialogClosedCallback: (params: { flowFinished: boolean }) => void;
}

export const loadMfaModuleSetupFlowDialog = () =>
  import("./dialog-op-mfa-module-setup-flow");

export const showMfaModuleSetupFlowDialog = (
  element: HTMLElement,
  dialogParams: MfaModuleSetupFlowDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "op-mfa-module-setup-flow",
    dialogImport: loadMfaModuleSetupFlowDialog,
    dialogParams,
  });
};
