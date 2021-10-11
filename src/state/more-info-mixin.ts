import type { PropertyValues } from "lit-element";
import type { OPPDomEvent } from "../common/dom/fire_event";
import { showDialog } from "../dialogs/make-dialog-manager";
import type { MoreInfoDialogParams } from "../dialogs/more-info/op-more-info-dialog";
import type { Constructor } from "../types";
import type { OppBaseEl } from "./opp-base-mixin";

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-more-info": MoreInfoDialogParams;
  }
}

let moreInfoImportPromise;
const importMoreInfo = () => {
  if (!moreInfoImportPromise) {
    moreInfoImportPromise = import("../dialogs/more-info/op-more-info-dialog");
  }
  return moreInfoImportPromise;
};

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps: PropertyValues) {
      super.firstUpdated(changedProps);
      this.addEventListener("opp-more-info", (ev) => this._handleMoreInfo(ev));

      // Load it once we are having the initial rendering done.
      importMoreInfo();
    }

    private async _handleMoreInfo(ev: OPPDomEvent<MoreInfoDialogParams>) {
      showDialog(
        this,
        this.shadowRoot!,
        "op-more-info-dialog",
        {
          entityId: ev.detail.entityId,
        },
        importMoreInfo
      );
    }
  };
