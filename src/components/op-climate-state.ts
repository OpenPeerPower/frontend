import { OppEntity } from "openpeerpower-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { formatNumber } from "../common/string/format_number";
import { CLIMATE_PRESET_NONE } from "../data/climate";
import type { OpenPeerPower } from "../types";

@customElement("ha-climate-state")
class HaClimateState extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public stateObj!: OppEntity;

  protected render(): TemplateResult {
    const currentStatus = this._computeCurrentStatus();

    return html`<div class="target">
        ${this.stateObj.state !== "unknown"
          ? html`<span class="state-label">
              ${this._localizeState()}
              ${this.stateObj.attributes.preset_mode &&
              this.stateObj.attributes.preset_mode !== CLIMATE_PRESET_NONE
                ? html`-
                  ${this.opp.localize(
                    `state_attributes.climate.preset_mode.${this.stateObj.attributes.preset_mode}`
                  ) || this.stateObj.attributes.preset_mode}`
                : ""}
            </span>`
          : ""}
        <div class="unit">${this._computeTarget()}</div>
      </div>

      ${currentStatus
        ? html`<div class="current">
            ${this.opp.localize("ui.card.climate.currently")}:
            <div class="unit">${currentStatus}</div>
          </div>`
        : ""}`;
  }

  private _computeCurrentStatus(): string | undefined {
    if (!this.opp || !this.stateObj) {
      return undefined;
    }

    if (this.stateObj.attributes.current_temperature != null) {
      return `${formatNumber(
        this.stateObj.attributes.current_temperature,
        this.opp.locale
      )} ${this.opp.config.unit_system.temperature}`;
    }

    if (this.stateObj.attributes.current_humidity != null) {
      return `${formatNumber(
        this.stateObj.attributes.current_humidity,
        this.opp.locale
      )} %`;
    }

    return undefined;
  }

  private _computeTarget(): string {
    if (!this.opp || !this.stateObj) {
      return "";
    }

    if (
      this.stateObj.attributes.target_temp_low != null &&
      this.stateObj.attributes.target_temp_high != null
    ) {
      return `${formatNumber(
        this.stateObj.attributes.target_temp_low,
        this.opp.locale
      )}-${formatNumber(
        this.stateObj.attributes.target_temp_high,
        this.opp.locale
      )} ${this.opp.config.unit_system.temperature}`;
    }

    if (this.stateObj.attributes.temperature != null) {
      return `${formatNumber(
        this.stateObj.attributes.temperature,
        this.opp.locale
      )} ${this.opp.config.unit_system.temperature}`;
    }
    if (
      this.stateObj.attributes.target_humidity_low != null &&
      this.stateObj.attributes.target_humidity_high != null
    ) {
      return `${formatNumber(
        this.stateObj.attributes.target_humidity_low,
        this.opp.locale
      )}-${formatNumber(
        this.stateObj.attributes.target_humidity_high,
        this.opp.locale
      )} %`;
    }

    if (this.stateObj.attributes.humidity != null) {
      return `${formatNumber(
        this.stateObj.attributes.humidity,
        this.opp.locale
      )} %`;
    }

    return "";
  }

  private _localizeState(): string {
    const stateString = this.opp.localize(
      `component.climate.state._.${this.stateObj.state}`
    );

    return this.stateObj.attributes.hvac_action
      ? `${this.opp.localize(
          `state_attributes.climate.hvac_action.${this.stateObj.attributes.hvac_action}`
        )} (${stateString})`
      : stateString;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
        white-space: nowrap;
      }

      .target {
        color: var(--primary-text-color);
      }

      .current {
        color: var(--secondary-text-color);
      }

      .state-label {
        font-weight: bold;
        text-transform: capitalize;
      }

      .unit {
        display: inline-block;
        direction: ltr;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-climate-state": HaClimateState;
  }
}
