import "@material/mwc-button/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-lock-entity-row")
class HuiLockEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntityConfig;

  public setConfig(config: EntityConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }

    const stateObj = this.opp.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    return html`
      <hui-generic-entity-row .opp=${this.opp} .config=${this._config}>
        <mwc-button
          @click="${this._callService}"
          .disabled=${UNAVAILABLE_STATES.includes(stateObj.state)}
          class="text-content"
        >
          ${stateObj.state === "locked"
            ? this.opp!.localize("ui.card.lock.unlock")
            : this.opp!.localize("ui.card.lock.lock")}
        </mwc-button>
      </hui-generic-entity-row>
    `;
  }

  static get styles(): CSSResult {
    return css`
      mwc-button {
        margin-right: -0.57em;
      }
    `;
  }

  private _callService(ev): void {
    ev.stopPropagation();
    const stateObj = this.opp!.states[this._config!.entity];
    this.opp!.callService(
      "lock",
      stateObj.state === "locked" ? "unlock" : "lock",
      { entity_id: stateObj.entity_id }
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-lock-entity-row": HuiLockEntityRow;
  }
}
