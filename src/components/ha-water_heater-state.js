import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import { computeStateDisplay } from "../common/entity/compute_state_display";
import { formatNumber } from "../common/string/format_number";
import LocalizeMixin from "../mixins/localize-mixin";

/*
 * @appliesMixin LocalizeMixin
 */
class HaWaterHeaterState extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          justify-content: center;
          white-space: nowrap;
        }

        .target {
          color: var(--primary-text-color);
        }

        .current {
          color: var(--secondary-text-color);
        }

        .state-label {
          font-weight: bold;
          text-transform: capitalize;
        }
      </style>

      <div class="target">
        <span class="state-label"> [[_localizeState(stateObj)]] </span>
        [[computeTarget(opp, stateObj)]]
      </div>

      <template is="dom-if" if="[[currentStatus]]">
        <div class="current">
          [[localize('ui.card.water_heater.currently')]]: [[currentStatus]]
        </div>
      </template>
    `;
  }

  static get properties() {
    return {
      opp: Object,
      stateObj: Object,
    };
  }

  computeTarget(opp, stateObj) {
    if (!opp || !stateObj) return null;
    // We're using "!= null" on purpose so that we match both null and undefined.

    if (
      stateObj.attributes.target_temp_low != null &&
      stateObj.attributes.target_temp_high != null
    ) {
      return `${formatNumber(
        stateObj.attributes.target_temp_low,
        this.opp.locale
      )} - ${formatNumber(
        stateObj.attributes.target_temp_high,
        this.opp.locale
      )} ${opp.config.unit_system.temperature}`;
    }
    if (stateObj.attributes.temperature != null) {
      return `${formatNumber(
        stateObj.attributes.temperature,
        this.opp.locale
      )} ${opp.config.unit_system.temperature}`;
    }

    return "";
  }

  _localizeState(stateObj) {
    return computeStateDisplay(this.opp.localize, stateObj, this.opp.locale);
  }
}
customElements.define("ha-water_heater-state", HaWaterHeaterState);
