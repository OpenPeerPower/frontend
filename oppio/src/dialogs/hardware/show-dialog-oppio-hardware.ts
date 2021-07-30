import { fireEvent } from "../../../../src/common/dom/fire_event";
import { OppioHardwareInfo } from "../../../../src/data/oppio/hardware";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";

export interface OppioHardwareDialogParams {
  supervisor: Supervisor;
  hardware: OppioHardwareInfo;
}

export const showOppioHardwareDialog = (
  element: HTMLElement,
  dialogParams: OppioHardwareDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-hardware",
    dialogImport: () => import("./dialog-oppio-hardware"),
    dialogParams,
  });
};
