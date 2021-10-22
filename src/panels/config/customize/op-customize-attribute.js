import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../../components/op-icon-button";
import oppAttributeUtil from "../../../util/opp-attributes-util";
import "../op-form-style";
import "./types/op-customize-array";
import "./types/op-customize-boolean";
import "./types/op-customize-icon";
import "./types/op-customize-key-value";
import "./types/op-customize-string";

class HaCustomizeAttribute extends PolymerElement {
  static get template() {
    return html`
      <style include="op-form-style">
        :host {
          display: block;
          position: relative;
          padding-right: 40px;
        }

        .button {
          position: absolute;
          margin-top: -20px;
          top: 50%;
          right: 0;
        }
      </style>
      <div id="wrapper" class="form-group"></div>
      <op-icon-button
        class="button"
        icon="[[getIcon(item.secondary)]]"
        on-click="tapButton"
      ></op-icon-button>
    `;
  }

  static get properties() {
    return {
      item: {
        type: Object,
        notify: true,
        observer: "itemObserver",
      },
    };
  }

  tapButton() {
    if (this.item.secondary) {
      this.item = { ...this.item, secondary: false };
    } else {
      this.item = { ...this.item, closed: true };
    }
  }

  getIcon(secondary) {
    return secondary ? "opp:pencil" : "opp:close";
  }

  itemObserver(item) {
    const wrapper = this.$.wrapper;
    const tag = oppAttributeUtil.TYPE_TO_TAG[item.type].toUpperCase();
    let child;
    if (wrapper.lastChild && wrapper.lastChild.tagName === tag) {
      child = wrapper.lastChild;
    } else {
      if (wrapper.lastChild) {
        wrapper.removeChild(wrapper.lastChild);
      }
      // Creating an element with upper case works fine in Chrome, but in FF it doesn't immediately
      // become a defined Custom Element. Polymer does that in some later pass.
      this.$.child = child = document.createElement(tag.toLowerCase());
      child.className = "form-control";
      child.addEventListener("item-changed", () => {
        this.item = { ...child.item };
      });
    }
    child.setProperties({ item: this.item });
    if (child.parentNode === null) {
      wrapper.appendChild(child);
    }
  }
}
customElements.define("op-customize-attribute", HaCustomizeAttribute);
