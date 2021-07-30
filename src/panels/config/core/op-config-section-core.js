import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../../components/buttons/ha-call-service-button";
import "../../../components/ha-card";
import LocalizeMixin from "../../../mixins/localize-mixin";
import "../../../styles/polymer-op-style";
import "../ha-config-section";
import "./ha-config-analytics";
import "./ha-config-core-form";
import "./ha-config-name-form";
import "./ha-config-url-form";

/*
 * @appliesMixin LocalizeMixin
 */
class HaConfigSectionCore extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <op-config-section is-wide="[[isWide]]">
        <span slot="header"
          >[[localize('ui.panel.config.core.section.core.header')]]</span
        >
        <span slot="introduction"
          >[[localize('ui.panel.config.core.section.core.introduction')]]</span
        >

        <op-config-name-form opp="[[opp]]"></op-config-name-form>
        <op-config-core-form opp="[[opp]]"></op-config-core-form>
        <op-config-url-form opp="[[opp]]"></op-config-url-form>
        <op-config-analytics opp="[[opp]]"></op-config-analytics>
      </op-config-section>
    `;
  }

  static get properties() {
    return {
      opp: {
        type: Object,
      },

      isWide: {
        type: Boolean,
        value: false,
      },

      validating: {
        type: Boolean,
        value: false,
      },

      isValid: {
        type: Boolean,
        value: null,
      },

      validateLog: {
        type: String,
        value: "",
      },

      showAdvanced: Boolean,
    };
  }
}

customElements.define("ha-config-section-core", HaConfigSectionCore);
