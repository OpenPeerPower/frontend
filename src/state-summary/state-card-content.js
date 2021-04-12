/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import dynamicContentUpdater from "../common/dom/dynamic_content_updater";
import { stateCardType } from "../common/entity/state_card_type";
import "./state-card-climate";
import "./state-card-configurator";
import "./state-card-cover";
import "./state-card-display";
import "./state-card-input_number";
import "./state-card-input_select";
import "./state-card-input_text";
import "./state-card-lock";
import "./state-card-media_player";
import "./state-card-number";
import "./state-card-scene";
import "./state-card-script";
import "./state-card-timer";
import "./state-card-toggle";
import "./state-card-vacuum";
import "./state-card-water_heater";

class StateCardContent extends PolymerElement {
  static get properties() {
    return {
      opp: Object,
      stateObj: Object,
      inDialog: {
        type: Boolean,
        value: false,
      },
    };
  }

  static get observers() {
    return ["inputChanged(opp, inDialog, stateObj)"];
  }

  inputChanged(opp, inDialog, stateObj) {
    let stateCard;
    if (!stateObj || !opp) return;
    if (stateObj.attributes && "custom_ui_state_card" in stateObj.attributes) {
      stateCard = stateObj.attributes.custom_ui_state_card;
    } else {
      stateCard = "state-card-" + stateCardType(opp, stateObj);
    }
    dynamicContentUpdater(this, stateCard.toUpperCase(), {
      opp: opp,
      stateObj: stateObj,
      inDialog: inDialog,
    });
  }
}
customElements.define("state-card-content", StateCardContent);
