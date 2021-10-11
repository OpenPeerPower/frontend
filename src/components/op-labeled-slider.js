import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "./op-icon";
import "./op-slider";

class HaLabeledSlider extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }

        .title {
          margin: 5px 0 8px;
          color: var(--primary-text-color);
        }

        .slider-container {
          display: flex;
        }

        op-icon {
          margin-top: 4px;
          color: var(--secondary-text-color);
        }

        op-slider {
          flex-grow: 1;
          background-image: var(--op-slider-background);
          border-radius: 4px;
        }
      </style>

      <div class="title">[[caption]]</div>
      <div class="extra-container"><slot name="extra"></slot></div>
      <div class="slider-container">
        <op-icon icon="[[icon]]" hidden$="[[!icon]]"></op-icon>
        <op-slider
          min="[[min]]"
          max="[[max]]"
          step="[[step]]"
          pin="[[pin]]"
          disabled="[[disabled]]"
          value="{{value}}"
        ></op-slider>
      </div>
    `;
  }

  static get properties() {
    return {
      caption: String,
      disabled: Boolean,
      min: Number,
      max: Number,
      pin: Boolean,
      step: Number,

      extra: {
        type: Boolean,
        value: false,
      },
      ignoreBarTouch: {
        type: Boolean,
        value: true,
      },
      icon: {
        type: String,
        value: "",
      },
      value: {
        type: Number,
        notify: true,
      },
    };
  }
}

customElements.define("ha-labeled-slider", HaLabeledSlider);
