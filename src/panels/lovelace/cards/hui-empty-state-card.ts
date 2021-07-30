import "@material/mwc-button/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/ha-card";
import { OpenPeerPower } from "../../../types";
import { LovelaceCard } from "../types";
import { EmptyStateCardConfig } from "./types";

@customElement("hui-empty-state-card")
export class HuiEmptyStateCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  public getCardSize(): number {
    return 2;
  }

  public setConfig(_config: EmptyStateCardConfig): void {
    // eslint-disable-next-line
  }

  protected render(): TemplateResult {
    if (!this.opp) {
      return html``;
    }

    return html`
      <op-card
        .header="${this.opp.localize(
          "ui.panel.lovelace.cards.empty_state.title"
        )}"
      >
        <div class="card-content">
          ${this.opp.localize("ui.panel.lovelace.cards.empty_state.no_devices")}
        </div>
        <div class="card-actions">
          <a href="/config/integrations">
            <mwc-button>
              ${this.opp.localize(
                "ui.panel.lovelace.cards.empty_state.go_to_integrations_page"
              )}
            </mwc-button>
          </a>
        </div>
      </op-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .content {
        margin-top: -1em;
        padding: 16px;
      }

      .card-actions a {
        text-decoration: none;
      }

      mwc-button {
        margin-left: -8px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-empty-state-card": HuiEmptyStateCard;
  }
}
