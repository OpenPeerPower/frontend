import type { Constructor, PropertyValues } from "lit-element";
import tinykeys from "tinykeys";
import {
  QuickBarParams,
  showQuickBar,
} from "../dialogs/quick-bar/show-dialog-quick-bar";
import { OpenPeerPower } from "../types";
import { storeState } from "../util/op-pref-storage";
import { OppElement } from "./opp-element";

declare global {
  interface OPPDomEvents {
    "opp-quick-bar": QuickBarParams;
    "opp-enable-shortcuts": OpenPeerPower["enableShortcuts"];
  }
}

export default <T extends Constructor<OppElement>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps: PropertyValues) {
      super.firstUpdated(changedProps);

      this.addEventListener("opp-enable-shortcuts", (ev) => {
        this._updateOpp({ enableShortcuts: ev.detail });
        storeState(this.opp!);
      });

      this._registerShortcut();
    }

    private _registerShortcut() {
      tinykeys(window, {
        e: (ev) => this._showQuickBar(ev),
        c: (ev) => this._showQuickBar(ev, true),
      });
    }

    private _showQuickBar(e: KeyboardEvent, commandMode = false) {
      if (!this._canShowQuickBar(e)) {
        return;
      }

      showQuickBar(this, { commandMode });
    }

    private _canShowQuickBar(e: KeyboardEvent) {
      return (
        this.opp?.user?.is_admin &&
        this.opp.enableShortcuts &&
        this._canOverrideAlphanumericInput(e)
      );
    }

    private _canOverrideAlphanumericInput(e: KeyboardEvent) {
      const el = e.composedPath()[0] as any;

      if (el.tagName === "TEXTAREA") {
        return false;
      }

      if (el.tagName !== "INPUT") {
        return true;
      }

      switch (el.type) {
        case "button":
        case "checkbox":
        case "hidden":
        case "radio":
        case "range":
          return true;
        default:
          return false;
      }
    }
  };
