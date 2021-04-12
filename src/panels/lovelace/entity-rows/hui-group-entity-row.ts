import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { DOMAINS_TOGGLE } from "../../../common/const";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import "../../../components/entity/ha-entity-toggle";
import { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-group-entity-row")
class HuiGroupEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntityConfig;

  private _computeCanToggle(opp: OpenPeerPower, entityIds: string[]): boolean {
    return entityIds.some((entityId) => {
      const domain = computeDomain(entityId);
      if (domain === "group") {
        return this._computeCanToggle(
          opp,
          this.opp?.states[entityId].attributes.entity_id
        );
      }
      return DOMAINS_TOGGLE.has(domain);
    });
  }

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
        ${this._computeCanToggle(this.opp, stateObj.attributes.entity_id)
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
                  this.opp.locale
                )}
              </div>
            `}
      </hui-generic-entity-row>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-group-entity-row": HuiGroupEntityRow;
  }
}
