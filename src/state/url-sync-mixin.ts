/* eslint-disable no-console */
import { UpdatingElement } from "lit-element";
import { OPPDomEvent } from "../common/dom/fire_event";
import {
  closeDialog,
  DialogClosedParams,
  DialogState,
  showDialog,
} from "../dialogs/make-dialog-manager";
import { ProvideOppElement } from "../mixins/provide-opp-lit-mixin";
import { Constructor } from "../types";

const DEBUG = false;

export const urlSyncMixin = <
  T extends Constructor<UpdatingElement & ProvideOppElement>
>(
  superClass: T
) =>
  // Disable this functionality in the demo.
  __DEMO__
    ? superClass
    : class extends superClass {
        private _ignoreNextPopState = false;

        public connectedCallback(): void {
          super.connectedCallback();
          if (history.length === 1) {
            history.replaceState({ ...history.state, root: true }, "");
          }
          window.addEventListener("popstate", this._popstateChangeListener);
          this.addEventListener("dialog-closed", this._dialogClosedListener);
        }

        public disconnectedCallback(): void {
          super.disconnectedCallback();
          window.removeEventListener("popstate", this._popstateChangeListener);
          this.removeEventListener("dialog-closed", this._dialogClosedListener);
        }

        private _dialogClosedListener = (
          ev: OPPDomEvent<DialogClosedParams>
        ) => {
          if (DEBUG) {
            console.log("dialog closed", ev.detail.dialog);
            console.log(
              "open",
              history.state?.open,
              "dialog",
              history.state?.dialog
            );
          }
          // If not closed by navigating back, and not a new dialog is open, remove the open state from history
          if (
            history.state?.open &&
            history.state?.dialog === ev.detail.dialog
          ) {
            if (DEBUG) {
              console.log("remove state", ev.detail.dialog);
            }
            this._ignoreNextPopState = true;
            history.back();
          }
        };

        private _popstateChangeListener = (ev: PopStateEvent) => {
          if (this._ignoreNextPopState) {
            if (
              ev.state?.oldState?.replaced ||
              ev.state?.oldState?.dialogParams === null
            ) {
              // if the previous dialog was replaced, or we could not copy the params, and the current dialog is closed, we should also remove the previous dialog from history
              if (DEBUG) {
                console.log("remove old state", ev.state.oldState);
              }
              history.back();
              return;
            }
            this._ignoreNextPopState = false;
            return;
          }
          if (ev.state && "dialog" in ev.state) {
            if (DEBUG) {
              console.log("popstate", ev);
            }
            this._handleDialogStateChange(ev.state);
          }
        };

        private async _handleDialogStateChange(state: DialogState) {
          if (DEBUG) {
            console.log("handle state", state);
          }
          if (!state.open) {
            const closed = await closeDialog(state.dialog);
            if (!closed) {
              if (DEBUG) {
                console.log("dialog could not be closed");
              }
              // dialog could not be closed, push state again
              history.pushState(
                {
                  dialog: state.dialog,
                  open: true,
                  dialogParams: null,
                  oldState: null,
                },
                ""
              );
              return;
            }
            if (state.oldState) {
              if (DEBUG) {
                console.log("handle old state");
              }
              this._handleDialogStateChange(state.oldState);
            }
            return;
          }
          if (state.dialogParams !== null) {
            showDialog(
              this,
              this.shadowRoot!,
              state.dialog,
              state.dialogParams
            );
          }
        }
      };
