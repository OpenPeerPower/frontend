import { fireEvent } from "../../../../src/common/dom/fire_event";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import "./dialog-oppio-network";

export interface OppioNetworkDialogParams {
  supervisor: Supervisor;
  loadData: () => Promise<void>;
}

export const showNetworkDialog = (
  element: HTMLElement,
  dialogParams: OppioNetworkDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-network",
    dialogImport: () => import("./dialog-oppio-network"),
    dialogParams,
  });
};
