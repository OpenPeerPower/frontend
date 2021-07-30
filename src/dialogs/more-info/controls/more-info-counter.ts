import "@material/mwc-button";
import { OppEntity } from "openpeerpower-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-counter")
class MoreInfoCounter extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    const disabled = UNAVAILABLE_STATES.includes(this.stateObj!.state);

    return html`
      <div class="actions">
        <mwc-button
          .action="${"increment"}"
          @click=${this._handleActionClick}
          .disabled=${disabled}
        >
          ${this.opp!.localize("ui.card.counter.actions.increment")}
        </mwc-button>
        <mwc-button
          .action="${"decrement"}"
          @click=${this._handleActionClick}
          .disabled=${disabled}
        >
          ${this.opp!.localize("ui.card.counter.actions.decrement")}
        </mwc-button>
        <mwc-button
          .action="${"reset"}"
          @click=${this._handleActionClick}
          .disabled=${disabled}
        >
          ${this.opp!.localize("ui.card.counter.actions.reset")}
        </mwc-button>
      </div>
    `;
  }

  private _handleActionClick(e: MouseEvent): void {
    const action = (e.currentTarget as any).action;
    this.opp.callService("counter", action, {
      entity_id: this.stateObj!.entity_id,
    });
  }

  static get styles(): CSSResultGroup {
    return css`
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
    "more-info-counter": MoreInfoCounter;
  }
}
