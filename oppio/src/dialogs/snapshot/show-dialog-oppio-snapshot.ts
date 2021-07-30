import { fireEvent } from "../../../../src/common/dom/fire_event";
import { LocalizeFunc } from "../../../../src/common/translations/localize";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";

export interface OppioSnapshotDialogParams {
  slug: string;
  onDelete?: () => void;
  onboarding?: boolean;
  supervisor?: Supervisor;
  localize?: LocalizeFunc;
}

export const showOppioSnapshotDialog = (
  element: HTMLElement,
  dialogParams: OppioSnapshotDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-snapshot",
    dialogImport: () => import("./dialog-oppio-snapshot"),
    dialogParams,
  });
};
