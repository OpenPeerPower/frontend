import "@material/mwc-button";
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
import { triggerAutomationActions } from "../../../data/automation";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-automation")
class MoreInfoAutomation extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html`
      <div class="flex">
        <div>${this.opp.localize("ui.card.automation.last_triggered")}:</div>
        <ha-relative-time
          .opp=${this.opp}
          .datetime=${this.stateObj.attributes.last_triggered}
        ></ha-relative-time>
      </div>

      <div class="actions">
        <mwc-button
          @click=${this._runActions}
          .disabled=${UNAVAILABLE_STATES.includes(this.stateObj!.state)}
        >
          ${this.opp.localize("ui.card.automation.trigger")}
        </mwc-button>
      </div>
    `;
  }

  private _runActions() {
    triggerAutomationActions(this.opp, this.stateObj!.entity_id);
  }

  static get styles(): CSSResult {
    return css`
      .flex {
        display: flex;
        justify-content: space-between;
      }
      .actions {
        margin: 8px 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-automation": MoreInfoAutomation;
  }
}
