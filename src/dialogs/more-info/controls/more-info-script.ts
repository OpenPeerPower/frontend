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
import "../../../components/ha-relative-time";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-script")
class MoreInfoScript extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html`
      <div class="flex">
        <div>
          ${this.opp.localize(
            "ui.dialogs.more_info_control.script.last_triggered"
          )}:
        </div>
        ${this.stateObj.attributes.last_triggered
          ? html`
              <ha-relative-time
                .opp=${this.opp}
                .datetime=${this.stateObj.attributes.last_triggered}
              ></ha-relative-time>
            `
          : this.opp.localize("ui.components.relative_time.never")}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .flex {
        display: flex;
        justify-content: space-between;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-script": MoreInfoScript;
  }
}
