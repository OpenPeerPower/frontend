/* eslint-plugin-disable lit */
import "@polymer/iron-flex-layout/iron-flex-layout-classes";
import "@polymer/paper-input/paper-input";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../components/entity/state-info";

class StateCardInputText extends PolymerElement {
  static get template() {
    return html`
      <style include="iron-flex iron-flex-alignment"></style>
      <style>
        paper-input {
          margin-left: 16px;
        }
      </style>

      <div class="horizontal justified layout">
        ${this.stateInfoTemplate}
        <paper-input
          no-label-float=""
          minlength="[[stateObj.attributes.min]]"
          maxlength="[[stateObj.attributes.max]]"
          value="{{value}}"
          auto-validate="[[stateObj.attributes.pattern]]"
          pattern="[[stateObj.attributes.pattern]]"
          type="[[stateObj.attributes.mode]]"
          on-change="selectedValueChanged"
          on-click="stopPropagation"
          placeholder="(empty value)"
        >
        </paper-input>
      </div>
    `;
  }

  static get stateInfoTemplate() {
    return html`
      <state-info
        opp="[[opp]]"
        state-obj="[[stateObj]]"
        in-dialog="[[inDialog]]"
      ></state-info>
    `;
  }

  static get properties() {
    return {
      opp: Object,

      inDialog: {
        type: Boolean,
        value: false,
      },

      stateObj: {
        type: Object,
        observer: "stateObjectChanged",
      },

      pattern: String,
      value: String,
    };
  }

  stateObjectChanged(newVal) {
    this.value = newVal.state;
  }

  selectedValueChanged() {
    if (this.value === this.stateObj.state) {
      return;
    }
    this.opp.callService("input_text", "set_value", {
      value: this.value,
      entity_id: this.stateObj.entity_id,
    });
  }

  stopPropagation(ev) {
    ev.stopPropagation();
  }
}

customElements.define("state-card-input_text", StateCardInputText);
