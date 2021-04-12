import { fireEvent } from "../../../../src/common/dom/fire_event";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import "./dialog-oppio-registries";

export interface RegistriesDialogParams {
  supervisor: Supervisor;
}

export const showRegistriesDialog = (
  element: HTMLElement,
  dialogParams: RegistriesDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-registries",
    dialogImport: () => import("./dialog-oppio-registries"),
    dialogParams,
  });
};
