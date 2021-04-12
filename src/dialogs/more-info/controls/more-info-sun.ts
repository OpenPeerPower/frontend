import { OppEntity } from "open-peer-power-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { formatTime } from "../../../common/datetime/format_time";
import { formatNumber } from "../../../common/string/format_number";
import "../../../components/ha-relative-time";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-sun")
class MoreInfoSun extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    const risingDate = new Date(this.stateObj.attributes.next_rising);
    const settingDate = new Date(this.stateObj.attributes.next_setting);
    const order = risingDate > settingDate ? ["set", "ris"] : ["ris", "set"];

    return html`
      ${order.map((item) => {
        return html`
          <div class="row">
            <div class="key">
              <span
                >${item === "ris"
                  ? this.opp.localize(
                      "ui.dialogs.more_info_control.sun.rising"
                    )
                  : this.opp.localize(
                      "ui.dialogs.more_info_control.sun.setting"
                    )}</span
              >
              <ha-relative-time
                .opp=${this.opp}
                .datetime=${item === "ris" ? risingDate : settingDate}
              ></ha-relative-time>
            </div>
            <div class="value">
              ${formatTime(
                item === "ris" ? risingDate : settingDate,
                this.opp.locale
              )}
            </div>
          </div>
        `;
      })}
      <div class="row">
        <div class="key">
          ${this.opp.localize("ui.dialogs.more_info_control.sun.elevation")}
        </div>
        <div class="value">
          ${formatNumber(this.stateObj.attributes.elevation, this.opp.locale)}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .row {
        margin: 0;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
      ha-relative-time {
        display: inline-block;
        white-space: nowrap;
      }
      ha-relative-time::first-letter {
        text-transform: lowercase;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-sun": MoreInfoSun;
  }
}
