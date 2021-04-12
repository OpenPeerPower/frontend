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
import "../../../components/ha-cover-controls";
import "../../../components/ha-cover-tilt-controls";
import { OpenPeerPower } from "../../../types";
import { isTiltOnly } from "../../../util/cover-model";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-cover-entity-row")
class HuiCoverEntityRow extends LitElement implements LovelaceRow {
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
        ${isTiltOnly(stateObj)
          ? html`
              <ha-cover-tilt-controls
                .opp=${this.opp}
                .stateObj=${stateObj}
              ></ha-cover-tilt-controls>
            `
          : html`
              <ha-cover-controls
                .opp=${this.opp}
                .stateObj=${stateObj}
              ></ha-cover-controls>
            `}
      </hui-generic-entity-row>
    `;
  }

  static get styles(): CSSResult {
    return css`
      ha-cover-controls,
      ha-cover-tilt-controls {
        margin-right: -0.57em;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-cover-entity-row": HuiCoverEntityRow;
  }
}
