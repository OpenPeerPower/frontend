import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { SelectSelector } from "../../data/selector";
import { OpenPeerPower } from "../../types";
import "../ha-paper-dropdown-menu";

@customElement("op-selector-select")
export class HaSelectSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public selector!: SelectSelector;

  @property() public value?: string;

  @property() public label?: string;

  @property({ type: Boolean }) public disabled = false;

  protected render() {
    return html`<op-paper-dropdown-menu
      .disabled=${this.disabled}
      .label=${this.label}
    >
      <paper-listbox
        slot="dropdown-content"
        attr-for-selected="item-value"
        .selected=${this.value}
        @selected-item-changed=${this._valueChanged}
      >
        ${this.selector.select.options.map(
          (item: string) => html`
            <paper-item .itemValue=${item}> ${item} </paper-item>
          `
        )}
      </paper-listbox>
    </op-paper-dropdown-menu>`;
  }

  private _valueChanged(ev) {
    if (this.disabled || !ev.detail.value) {
      return;
    }
    fireEvent(this, "value-changed", {
      value: ev.detail.value.itemValue,
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-paper-dropdown-menu {
        width: 100%;
        min-width: 200px;
        display: block;
      }
      paper-listbox {
        min-width: 200px;
      }
      paper-item {
        cursor: pointer;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-selector-select": HaSelectSelector;
  }
}
