import "@material/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../components/op-card";
import { OpenPeerPower } from "../../../types";
import "../../config/logs/error-log-card";
import { LovelaceCard } from "../types";

@customElement("hui-safe-mode-card")
export class HuiSafeModeCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  public getCardSize(): number {
    return 3;
  }

  public setConfig(_config: any): void {
    // No config necessary.
  }

  protected render(): TemplateResult {
    return html`
      <op-card
        .header=${this.opp!.localize(
          "ui.panel.lovelace.cards.safe-mode.header"
        )}
      >
        <div class="card-content">
          ${this.opp!.localize("ui.panel.lovelace.cards.safe-mode.description")}
        </div>
        <error-log-card .opp=${this.opp}></error-log-card>
      </op-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      op-card {
        --op-card-header-color: var(--primary-color);
      }
      error-log-card {
        display: block;
        padding-bottom: 16px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-safe-mode-card": HuiSafeModeCard;
  }
}
