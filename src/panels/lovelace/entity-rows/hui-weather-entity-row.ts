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
import { classMap } from "lit-html/directives/class-map";
import { ifDefined } from "lit-html/directives/if-defined";
import { DOMAINS_HIDE_MORE_INFO } from "../../../common/const";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateIcon } from "../../../common/entity/state_icon";
import { formatNumber } from "../../../common/string/format_number";
import "../../../components/entity/state-badge";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { ActionHandlerEvent } from "../../../data/lovelace";
import {
  getSecondaryWeatherAttribute,
  getWeatherStateIcon,
  getWeatherUnit,
  WeatherEntity,
  weatherSVGStyles,
} from "../../../data/weather";
import type { OpenPeerPower } from "../../../types";
import type { EntitiesCardEntityConfig } from "../cards/types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { LovelaceRow } from "./types";

@customElement("hui-weather-entity-row")
class HuiWeatherEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntitiesCardEntityConfig;

  public setConfig(config: EntitiesCardEntityConfig): void {
    if (!config?.entity) {
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

    const stateObj = this.opp.states[this._config.entity] as WeatherEntity;

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    const pointer =
      (this._config.tap_action && this._config.tap_action.action !== "none") ||
      (this._config.entity &&
        !DOMAINS_HIDE_MORE_INFO.includes(computeDomain(this._config.entity)));

    const weatherStateIcon = getWeatherStateIcon(stateObj.state, this);

    return html`
      <div
        class="icon-image ${classMap({
          pointer,
        })}"
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
        tabindex=${ifDefined(pointer ? "0" : undefined)}
      >
        ${weatherStateIcon ||
        html`
          <ha-icon class="weather-icon" .icon=${stateIcon(stateObj)}></ha-icon>
        `}
      </div>
      <div
        class="info ${classMap({
          pointer,
        })}"
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
      >
        ${this._config.name || computeStateName(stateObj)}
      </div>
      <div class="attributes">
        <div>
          ${UNAVAILABLE_STATES.includes(stateObj.state)
            ? computeStateDisplay(
                this.opp.localize,
                stateObj,
                this.opp.locale
              )
            : html`
                ${formatNumber(
                  stateObj.attributes.temperature,
                  this.opp.locale
                )}
                ${getWeatherUnit(this.opp, "temperature")}
              `}
        </div>
        <div class="secondary">
          ${getSecondaryWeatherAttribute(this.opp!, stateObj)}
        </div>
      </div>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.opp!, this._config!, ev.detail.action!);
  }

  static get styles(): CSSResult[] {
    return [
      weatherSVGStyles,
      css`
        :host {
          display: flex;
          align-items: center;
          flex-direction: row;
        }

        .info {
          margin-left: 16px;
          flex: 1 0 60px;
        }

        .info,
        .info > * {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .icon-image {
          display: flex;
          align-items: center;
          min-width: 40px;
        }

        .icon-image > * {
          flex: 0 0 40px;
          height: 40px;
        }

        .icon-image:focus {
          outline: none;
          background-color: var(--divider-color);
          border-radius: 50%;
        }

        .weather-icon {
          --iron-icon-width: 40px;
          --iron-icon-height: 40px;
        }

        :host([rtl]) .flex {
          margin-left: 0;
          margin-right: 16px;
        }

        .pointer {
          cursor: pointer;
        }

        .attributes {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: right;
          margin-left: 8px;
        }

        .secondary {
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-weather-entity-row": HuiWeatherEntityRow;
  }
}
