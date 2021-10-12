import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../../components/op-icon-button";
import "../../../layouts/opp-tabs-subpage";
import LocalizeMixin from "../../../mixins/localize-mixin";
import "../../../styles/polymer-op-style";
import { configSections } from "../ha-panel-config";
import "./ha-config-section-core";

/*
 * @appliesMixin LocalizeMixin
 */
class HaConfigCore extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="iron-flex op-style">
        .content {
          padding-bottom: 32px;
        }

        .border {
          margin: 32px auto 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
          max-width: 1040px;
        }

        .narrow .border {
          max-width: 640px;
        }
      </style>

      <opp-tabs-subpage
        opp="[[opp]]"
        narrow="[[narrow]]"
        route="[[route]]"
        back-path="/config"
        tabs="[[_computeTabs()]]"
        show-advanced="[[showAdvanced]]"
      >
        <div class$="[[computeClasses(isWide)]]">
          <op-config-section-core
            is-wide="[[isWide]]"
            show-advanced="[[showAdvanced]]"
            opp="[[opp]]"
          ></op-config-section-core>
        </div>
      </opp-tabs-subpage>
    `;
  }

  static get properties() {
    return {
      opp: Object,
      isWide: Boolean,
      narrow: Boolean,
      showAdvanced: Boolean,
      route: Object,
    };
  }

  _computeTabs() {
    return configSections.general;
  }

  computeClasses(isWide) {
    return isWide ? "content" : "content narrow";
  }
}

customElements.define("ha-config-core", HaConfigCore);
