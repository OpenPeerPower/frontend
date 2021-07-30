import { OPPDomEvent, ValidOppDomEvent } from "../common/dom/fire_event";
import { mainWindow } from "../common/dom/get_main_window";
import { ProvideOppElement } from "../mixins/provide-opp-lit-mixin";

declare global {
  // for fire event
  interface OPPDomEvents {
    "show-dialog": ShowDialogParams<unknown>;
    "close-dialog": undefined;
    "dialog-closed": DialogClosedParams;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "show-dialog": OPPDomEvent<ShowDialogParams<unknown>>;
    "dialog-closed": OPPDomEvent<DialogClosedParams>;
  }
}

export interface OppDialog<T = OPPDomEvents[ValidOppDomEvent]>
  extends HTMLElement {
  showDialog(params: T);
  closeDialog?: () => boolean | void;
}

interface ShowDialogParams<T> {
  dialogTag: keyof HTMLElementTagNameMap;
  dialogImport: () => Promise<unknown>;
  dialogParams: T;
}

export interface DialogClosedParams {
  dialog: string;
}

export interface DialogState {
  dialog: string;
  open: boolean;
  oldState: null | DialogState;
  dialogParams?: unknown;
}

const LOADED = {};

export const showDialog = async (
  element: HTMLElement & ProvideOppElement,
  root: ShadowRoot | HTMLElement,
  dialogTag: string,
  dialogParams: unknown,
  dialogImport?: () => Promise<unknown>,
  addHistory = true
) => {
  if (!(dialogTag in LOADED)) {
    if (!dialogImport) {
      if (__DEV__) {
        // eslint-disable-next-line
        console.warn(
          "Asked to show dialog that's not loaded and can't be imported"
        );
      }
      return;
    }
    LOADED[dialogTag] = dialogImport().then(() => {
      const dialogEl = document.createElement(dialogTag) as OppDialog;
      element.provideOpp(dialogEl);
      root.appendChild(dialogEl);
      return dialogEl;
    });
  }

  if (addHistory) {
    mainWindow.history.replaceState(
      {
        dialog: dialogTag,
        open: false,
        oldState:
          mainWindow.history.state?.open &&
          mainWindow.history.state?.dialog !== dialogTag
            ? mainWindow.history.state
            : null,
      },
      ""
    );
    try {
      mainWindow.history.pushState(
        { dialog: dialogTag, dialogParams: dialogParams, open: true },
        ""
      );
    } catch (err) {
      // dialogParams could not be cloned, probably contains callback
      mainWindow.history.pushState(
        { dialog: dialogTag, dialogParams: null, open: true },
        ""
      );
    }
  }
  const dialogElement = await LOADED[dialogTag];
  dialogElement.showDialog(dialogParams);
};

export const replaceDialog = () => {
  mainWindow.history.replaceState(
    { ...mainWindow.history.state, replaced: true },
    ""
  );
};

export const closeDialog = async (dialogTag: string): Promise<boolean> => {
  if (!(dialogTag in LOADED)) {
    return true;
  }
  const dialogElement: OppDialog = await LOADED[dialogTag];
  if (dialogElement.closeDialog) {
    return dialogElement.closeDialog() !== false;
  }
  return true;
};

export const makeDialogManager = (
  element: HTMLElement & ProvideOppElement,
  root: ShadowRoot | HTMLElement
) => {
  element.addEventListener(
    "show-dialog",
    (e: OPPDomEvent<ShowDialogParams<unknown>>) => {
      const { dialogTag, dialogImport, dialogParams } = e.detail;
      showDialog(element, root, dialogTag, dialogParams, dialogImport);
    }
  );
};
