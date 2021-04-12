import { getPanelTitle } from "../data/panel";
import { Constructor, OpenPeerPower } from "../types";
import { OppBaseEl } from "./opp-base-mixin";

const setTitle = (title: string | undefined) => {
  document.title = title ? `${title} - Open Peer Power` : "Open Peer Power";
};

export const panelTitleMixin = <T extends Constructor<OppBaseEl>>(
  superClass: T
) =>
  class extends superClass {
    protected updated(changedProps) {
      super.updated(changedProps);
      if (!changedProps.has("opp") || !this.opp) {
        return;
      }

      const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;

      if (
        !oldOpp ||
        oldOpp.panels !== this.opp.panels ||
        oldOpp.panelUrl !== this.opp.panelUrl ||
        oldOpp.localize !== this.opp.localize
      ) {
        setTitle(getPanelTitle(this.opp));
      }
    }
  };
