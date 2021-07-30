import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { OpenPeerPower } from "../../types";
import "../ha-formfield";
import "../ha-switch";

@customElement("ha-selector-boolean")
export class HaBooleanSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public value?: number;

  @property() public label?: string;

  @property({ type: Boolean }) public disabled = false;

  protected render() {
    return html` <op-formfield alignEnd spaceBetween .label=${this.label}>
      <op-switch
        .checked=${this.value}
        @change=${this._handleChange}
        .disabled=${this.disabled}
      ></op-switch>
    </op-formfield>`;
  }

  private _handleChange(ev) {
    const value = ev.target.checked;
    if (this.value === value) {
      return;
    }
    fireEvent(this, "value-changed", { value });
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-formfield {
        width: 100%;
        margin: 16px 0;
        --mdc-typography-body2-font-size: 1em;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector-boolean": HaBooleanSelector;
  }
}
