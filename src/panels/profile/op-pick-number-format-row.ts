import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../components/op-card";
import "../../components/op-paper-dropdown-menu";
import { OpenPeerPower } from "../../types";
import "../../components/op-settings-row";
import { formatNumber } from "../../common/string/format_number";
import { NumberFormat } from "../../data/translation";
import { fireEvent } from "../../common/dom/fire_event";

@customElement("op-pick-number-format-row")
class NumberFormatRow extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  protected render(): TemplateResult {
    return html`
      <op-settings-row .narrow=${this.narrow}>
        <span slot="heading">
          ${this.opp.localize("ui.panel.profile.number_format.header")}
        </span>
        <span slot="description">
          ${this.opp.localize("ui.panel.profile.number_format.description")}
        </span>
        <op-paper-dropdown-menu
          label=${this.opp.localize(
            "ui.panel.profile.number_format.dropdown_label"
          )}
          dynamic-align
          .disabled=${this.opp.locale === undefined}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${this.opp.locale.number_format}
            @iron-select=${this._handleFormatSelection}
            attr-for-selected="format"
          >
            ${Object.values(NumberFormat).map((format) => {
              const formattedNumber = formatNumber(1234567.89, {
                language: this.opp.locale.language,
                number_format: format,
              });
              const value = this.opp.localize(
                `ui.panel.profile.number_format.formats.${format}`
              );
              const twoLine = value.slice(value.length - 2) !== "89"; // Display explicit number formats on one line
              return html`
                <paper-item .format=${format}>
                  <paper-item-body ?two-line=${twoLine}>
                    <div>${value}</div>
                    ${twoLine
                      ? html`<div secondary>${formattedNumber}</div>`
                      : ""}
                  </paper-item-body>
                </paper-item>
              `;
            })}
          </paper-listbox>
        </op-paper-dropdown-menu>
      </op-settings-row>
    `;
  }

  private async _handleFormatSelection(ev: CustomEvent) {
    fireEvent(this, "opp-number-format-select", ev.detail.item.format);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-pick-number-format-row": NumberFormatRow;
  }
}
