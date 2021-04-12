import { fireEvent } from "../../../../src/common/dom/fire_event";
import "./dialog-oppio-snapshot-upload";

export interface OppioSnapshotUploadDialogParams {
  showSnapshot: (slug: string) => void;
  reloadSnapshot?: () => Promise<void>;
  onboarding?: boolean;
}

export const showSnapshotUploadDialog = (
  element: HTMLElement,
  dialogParams: OppioSnapshotUploadDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-snapshot-upload",
    dialogImport: () => import("./dialog-oppio-snapshot-upload"),
    dialogParams,
  });
};
