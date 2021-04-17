import { PropertyValues } from "lit-element";
import { OPPDomEvent } from "../common/dom/fire_event";
import { makeDialogManager, showDialog } from "../dialogs/make-dialog-manager";
import { Constructor } from "../types";
import { OppBaseEl } from "./opp-base-mixin";

interface RegisterDialogParams {
  dialogShowEvent: keyof OPPDomEvents;
  dialogTag: keyof HTMLElementTagNameMap;
  dialogImport: () => Promise<unknown>;
  addHistory?: boolean;
}

declare global {
  // for fire event
  interface OPPDomEvents {
    "register-dialog": RegisterDialogParams;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "register-dialog": OPPDomEvent<RegisterDialogParams>;
  }
}

export const dialogManagerMixin = <T extends Constructor<OppBaseEl>>(
  superClass: T
) =>
  class extends superClass {
    protected firstUpdated(changedProps: PropertyValues) {
      super.firstUpdated(changedProps);
      // deprecated
      this.addEventListener("register-dialog", (e) =>
        this.registerDialog(e.detail)
      );
      makeDialogManager(this, this.shadowRoot!);
    }

    private registerDialog({
      dialogShowEvent,
      dialogTag,
      dialogImport,
      addHistory = true,
    }: RegisterDialogParams) {
      this.addEventListener(dialogShowEvent, (showEv) => {
        showDialog(
          this,
          this.shadowRoot!,
          dialogTag,
          (showEv as OPPDomEvent<unknown>).detail,
          dialogImport,
          addHistory
        );
      });
    }
  };
