import "@polymer/paper-input/paper-input";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../../../components/op-icon";

class HaCustomizeIcon extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          @apply --layout-horizontal;
        }
        .icon-image {
          border: 1px solid grey;
          padding: 8px;
          margin-right: 20px;
          margin-top: 10px;
        }
      </style>
      <op-icon class="icon-image" icon="[[item.value]]"></op-icon>
      <paper-input
        disabled="[[item.secondary]]"
        label="Icon"
        value="{{item.value}}"
      >
      </paper-input>
    `;
  }

  static get properties() {
    return {
      item: {
        type: Object,
        notifies: true,
      },
    };
  }
}
customElements.define("op-customize-icon", HaCustomizeIcon);
