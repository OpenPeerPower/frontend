import { PropertyValues } from "lit-element";
import { OPPDomEvent } from "../common/dom/fire_event";
import { HapticType } from "../data/haptics";
import { Constructor, OpenPeerPower } from "../types";
import { storeState } from "../util/ha-pref-storage";
import { OppBaseEl } from "./opp-base-mixin";

interface VibrateParams {
  vibrate: OpenPeerPower["vibrate"];
}

declare global {
  // for fire event
  interface OPPDomEvents {
    "opp-vibrate": VibrateParams;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "opp-vibrate": OPPDomEvent<VibrateParams>;
  }
}

const hapticPatterns = {
  success: [50, 50, 50],
  warning: [100, 50, 100],
  failure: [200, 100, 200],
  light: [50],
  medium: [100],
  heavy: [200],
  selection: [20],
};

const handleHaptic = (hapticTypeEvent: OPPDomEvent<HapticType>) => {
  navigator.vibrate(hapticPatterns[hapticTypeEvent.detail]);
};

export const hapticMixin = <T extends Constructor<OppBaseEl>>(superClass: T) =>
  class extends superClass {
    protected firstUpdated(changedProps: PropertyValues) {
      super.firstUpdated(changedProps);
      this.addEventListener("opp-vibrate", (ev) => {
        const vibrate = ev.detail.vibrate;
        if (navigator.vibrate && vibrate) {
          window.addEventListener("haptic", handleHaptic);
        } else {
          window.removeEventListener("haptic", handleHaptic);
        }
        this._updateOpp({ vibrate });
        storeState(this.opp!);
      });
    }

    protected oppConnected() {
      super.oppConnected();
      if (navigator.vibrate && this.opp!.vibrate) {
        window.addEventListener("haptic", handleHaptic);
      }
    }
  };
