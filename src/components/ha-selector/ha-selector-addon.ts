import { customElement, html, LitElement, property } from "lit-element";
import { AddonSelector } from "../../data/selector";
import { OpenPeerPower } from "../../types";
import "../ha-addon-picker";

@customElement("ha-selector-addon")
export class HaAddonSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public selector!: AddonSelector;

  @property() public value?: any;

  @property() public label?: string;

  protected render() {
    return html`<ha-addon-picker
      .opp=${this.opp}
      .value=${this.value}
      .label=${this.label}
      allow-custom-entity
    ></ha-addon-picker>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector-addon": HaAddonSelector;
  }
}
