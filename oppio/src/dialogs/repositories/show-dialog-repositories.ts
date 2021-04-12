import { fireEvent } from "../../../../src/common/dom/fire_event";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import "./dialog-oppio-repositories";

export interface OppioRepositoryDialogParams {
  supervisor: Supervisor;
  url?: string;
}

export const showRepositoriesDialog = (
  element: HTMLElement,
  dialogParams: OppioRepositoryDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-repositories",
    dialogImport: () => import("./dialog-oppio-repositories"),
    dialogParams,
  });
};
