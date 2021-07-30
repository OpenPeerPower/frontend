import { fireEvent } from "../../../../src/common/dom/fire_event";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";

export interface OppioCreateSnapshotDialogParams {
  supervisor: Supervisor;
  onCreate: () => void;
}

export const showOppioCreateSnapshotDialog = (
  element: HTMLElement,
  dialogParams: OppioCreateSnapshotDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-create-snapshot",
    dialogImport: () => import("./dialog-oppio-create-snapshot"),
    dialogParams,
  });
};
