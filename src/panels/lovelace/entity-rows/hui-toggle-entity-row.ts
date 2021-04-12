import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import "../../../components/entity/ha-entity-toggle";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-toggle-entity-row")
class HuiToggleEntityRow extends LitElement implements LovelaceRow {
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
        ${stateObj.state === "on" ||
        stateObj.state === "off" ||
        UNAVAILABLE_STATES.includes(stateObj.state)
          ? html`
              <ha-entity-toggle
                .opp=${this.opp}
                .stateObj=${stateObj}
              ></ha-entity-toggle>
            `
          : html`
              <div class="text-content">
                ${computeStateDisplay(
                  this.opp!.localize,
                  stateObj,
                  this.opp!.locale
                )}
              </div>
            `}
      </hui-generic-entity-row>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-toggle-entity-row": HuiToggleEntityRow;
  }
}
