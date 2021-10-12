import "@material/mwc-button/mwc-button";
import { STATE_NOT_RUNNING } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/op-card";
import "../../../components/op-circular-progress";
import { LovelaceCardConfig } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { LovelaceCard } from "../types";

@customElement("hui-starting-card")
export class HuiStartingCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  public getCardSize(): number {
    return 2;
  }

  public setConfig(_config: LovelaceCardConfig): void {
    // eslint-disable-next-line
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!changedProperties.has("opp") || !this.opp!.config) {
      return;
    }

    if (this.opp!.config.state !== STATE_NOT_RUNNING) {
      fireEvent(this, "config-refresh");
    }
  }

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }

    return html`
      <div class="content">
        <op-circular-progress active></op-circular-progress>
        ${this.opp.localize("ui.panel.lovelace.cards.starting.description")}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        height: calc(100vh - var(--header-height));
      }
      op-circular-progress {
        padding-bottom: 20px;
      }
      .content {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-starting-card": HuiStartingCard;
  }
}
