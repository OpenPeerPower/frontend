import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { dynamicElement } from "../../common/dom/dynamic-element-directive";
import { Selector } from "../../data/selector";
import { OpenPeerPower } from "../../types";
import "./op-selector-action";
import "./op-selector-addon";
import "./op-selector-area";
import "./op-selector-boolean";
import "./op-selector-device";
import "./op-selector-entity";
import "./op-selector-number";
import "./op-selector-object";
import "./op-selector-select";
import "./op-selector-target";
import "./op-selector-text";
import "./op-selector-time";

@customElement("op-selector")
export class HaSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public selector!: Selector;

  @property() public value?: any;

  @property() public label?: string;

  @property() public placeholder?: any;

  @property({ type: Boolean }) public disabled = false;

  public focus() {
    const input = this.shadowRoot!.getElementById("selector");
    if (!input) {
      return;
    }
    (input as HTMLElement).focus();
  }

  private get _type() {
    return Object.keys(this.selector)[0];
  }

  protected render() {
    return html`
      ${dynamicElement(`op-selector-${this._type}`, {
        opp: this.opp,
        selector: this.selector,
        value: this.value,
        label: this.label,
        placeholder: this.placeholder,
        disabled: this.disabled,
        id: "selector",
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-selector": HaSelector;
  }
}
