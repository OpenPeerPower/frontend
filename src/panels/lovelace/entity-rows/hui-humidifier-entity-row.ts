import {
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import "../../../components/entity/ha-entity-toggle";
import { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-humidifier-entity-row")
class HuiHumidifierEntityRow extends LitElement implements LovelaceRow {
  @property() public opp?: OpenPeerPower;

  @property() private _config?: EntityConfig;

  public setConfig(config: EntityConfig): void {
    if (!config || !config.entity) {
      throw new Error("Entity must be specified");
    }

    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
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
      <hui-generic-entity-row
        .opp=${this.opp}
        .config=${this._config}
        .secondaryText=${stateObj.attributes.humidity
          ? `${this.opp!.localize("ui.card.humidifier.humidity")}:
            ${stateObj.attributes.humidity} %${
              stateObj.attributes.mode
                ? ` (${
                    this.opp!.localize(
                      `state_attributes.humidifier.mode.${stateObj.attributes.mode}`
                    ) || stateObj.attributes.mode
                  })`
                : ""
            }`
          : ""}
      >
        <op-entity-toggle
          .opp=${this.opp}
          .stateObj=${stateObj}
        ></op-entity-toggle>
      </hui-generic-entity-row>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-humidifier-entity-row": HuiHumidifierEntityRow;
  }
}
