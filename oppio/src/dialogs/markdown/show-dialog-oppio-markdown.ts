import { fireEvent } from "../../../../src/common/dom/fire_event";

export interface OppioMarkdownDialogParams {
  title: string;
  content: string;
}

export const showOppioMarkdownDialog = (
  element: HTMLElement,
  dialogParams: OppioMarkdownDialogParams
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-oppio-markdown",
    dialogImport: () => import("./dialog-oppio-markdown"),
    dialogParams,
  });
};
