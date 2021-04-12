import { OPPDomEvent } from "../common/dom/fire_event";
import { Constructor, OpenPeerPower } from "../types";
import { storeState } from "../util/ha-pref-storage";
import { OppBaseEl } from "./opp-base-mixin";

interface DockSidebarParams {
  dock: OpenPeerPower["dockedSidebar"];
}

interface DefaultPanelParams {
  defaultPanel: OpenPeerPower["defaultPanel"];
}

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-dock-sidebar": DockSidebarParams;
    "opp-default-panel": DefaultPanelParams;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "opp-dock-sidebar": OPPDomEvent<DockSidebarParams>;
    "opp-default-panel": OPPDomEvent<DefaultPanelParams>;
  }
}

export default <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.addEventListener("opp-dock-sidebar", (ev) => {
        this._updateOpp({ dockedSidebar: ev.detail.dock });
        storeState(this.opp!);
      });
      this.addEventListener("opp-default-panel", (ev) => {
        this._updateOpp({ defaultPanel: ev.detail.defaultPanel });
        storeState(this.opp!);
      });
    }
  };
