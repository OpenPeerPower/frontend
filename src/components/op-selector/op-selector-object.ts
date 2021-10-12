import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { OpenPeerPower } from "../../types";
import "../op-yaml-editor";

@customElement("op-selector-object")
export class HaObjectSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public value?: any;

  @property() public label?: string;

  @property() public placeholder?: string;

  @property({ type: Boolean }) public disabled = false;

  protected render() {
    return html`<op-yaml-editor
      .disabled=${this.disabled}
      .placeholder=${this.placeholder}
      .defaultValue=${this.value}
      @value-changed=${this._handleChange}
    ></op-yaml-editor>`;
  }

  private _handleChange(ev) {
    const value = ev.target.value;
    if (!ev.target.isValid) {
      return;
    }
    if (this.value === value) {
      return;
    }
    fireEvent(this, "value-changed", { value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-selector-object": HaObjectSelector;
  }
}
