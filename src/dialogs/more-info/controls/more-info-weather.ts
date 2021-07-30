import {
  mdiAlertCircleOutline,
  mdiEye,
  mdiGauge,
  mdiThermometer,
  mdiWaterPercent,
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherHail,
  mdiWeatherLightning,
  mdiWeatherLightningRainy,
  mdiWeatherNight,
  mdiWeatherPartlyCloudy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSnowyRainy,
  mdiWeatherSunny,
  mdiWeatherWindy,
  mdiWeatherWindyVariant,
} from "@mdi/js";
import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators";
import { formatDateWeekday } from "../../../common/datetime/format_date";
import { formatTimeWeekday } from "../../../common/datetime/format_time";
import { formatNumber } from "../../../common/string/format_number";
import "../../../components/ha-svg-icon";
import { getWeatherUnit, getWind } from "../../../data/weather";
import { OpenPeerPower } from "../../../types";

const weatherIcons = {
  "clear-night": mdiWeatherNight,
  cloudy: mdiWeatherCloudy,
  exceptional: mdiAlertCircleOutline,
  fog: mdiWeatherFog,
  hail: mdiWeatherHail,
  lightning: mdiWeatherLightning,
  "lightning-rainy": mdiWeatherLightningRainy,
  partlycloudy: mdiWeatherPartlyCloudy,
  pouring: mdiWeatherPouring,
  rainy: mdiWeatherRainy,
  snowy: mdiWeatherSnowy,
  "snowy-rainy": mdiWeatherSnowyRainy,
  sunny: mdiWeatherSunny,
  windy: mdiWeatherWindy,
  "windy-variant": mdiWeatherWindyVariant,
};

@customElement("more-info-weather")
class MoreInfoWeather extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has("stateObj")) {
      return true;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    if (
      !oldOpp ||
      oldOpp.locale !== this.opp.locale ||
      oldOpp.config.unit_system !== this.opp.config.unit_system
    ) {
      return true;
    }

    return false;
  }

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html`
      <div class="flex">
        <op-svg-icon .path=${mdiThermometer}></op-svg-icon>
        <div class="main">
          ${this.opp.localize("ui.card.weather.attributes.temperature")}
        </div>
        <div>
          ${formatNumber(this.stateObj.attributes.temperature, this.opp.locale)}
          ${getWeatherUnit(this.opp, "temperature")}
        </div>
      </div>
      ${this._showValue(this.stateObj.attributes.pressure)
        ? html`
            <div class="flex">
              <op-svg-icon .path=${mdiGauge}></op-svg-icon>
              <div class="main">
                ${this.opp.localize("ui.card.weather.attributes.air_pressure")}
              </div>
              <div>
                ${formatNumber(
                  this.stateObj.attributes.pressure,
                  this.opp.locale
                )}
                ${getWeatherUnit(this.opp, "pressure")}
              </div>
            </div>
          `
        : ""}
      ${this._showValue(this.stateObj.attributes.humidity)
        ? html`
            <div class="flex">
              <op-svg-icon .path=${mdiWaterPercent}></op-svg-icon>
              <div class="main">
                ${this.opp.localize("ui.card.weather.attributes.humidity")}
              </div>
              <div>
                ${formatNumber(
                  this.stateObj.attributes.humidity,
                  this.opp.locale
                )}
                %
              </div>
            </div>
          `
        : ""}
      ${this._showValue(this.stateObj.attributes.wind_speed)
        ? html`
            <div class="flex">
              <op-svg-icon .path=${mdiWeatherWindy}></op-svg-icon>
              <div class="main">
                ${this.opp.localize("ui.card.weather.attributes.wind_speed")}
              </div>
              <div>
                ${getWind(
                  this.opp,
                  this.stateObj.attributes.wind_speed,
                  this.stateObj.attributes.wind_bearing
                )}
              </div>
            </div>
          `
        : ""}
      ${this._showValue(this.stateObj.attributes.visibility)
        ? html`
            <div class="flex">
              <op-svg-icon .path=${mdiEye}></op-svg-icon>
              <div class="main">
                ${this.opp.localize("ui.card.weather.attributes.visibility")}
              </div>
              <div>
                ${formatNumber(
                  this.stateObj.attributes.visibility,
                  this.opp.locale
                )}
                ${getWeatherUnit(this.opp, "length")}
              </div>
            </div>
          `
        : ""}
      ${this.stateObj.attributes.forecast
        ? html`
            <div class="section">
              ${this.opp.localize("ui.card.weather.forecast")}:
            </div>
            ${this.stateObj.attributes.forecast.map(
              (item) => html`
                <div class="flex">
                  ${item.condition
                    ? html`
                        <op-svg-icon
                          .path="${weatherIcons[item.condition]}"
                        ></op-svg-icon>
                      `
                    : ""}
                  ${!this._showValue(item.templow)
                    ? html`
                        <div class="main">
                          ${formatTimeWeekday(
                            new Date(item.datetime),
                            this.opp.locale
                          )}
                        </div>
                      `
                    : ""}
                  ${this._showValue(item.templow)
                    ? html`
                        <div class="main">
                          ${formatDateWeekday(
                            new Date(item.datetime),
                            this.opp.locale
                          )}
                        </div>
                        <div class="templow">
                          ${formatNumber(item.templow, this.opp.locale)}
                          ${getWeatherUnit(this.opp, "temperature")}
                        </div>
                      `
                    : ""}
                  <div class="temp">
                    ${this._showValue(item.temperature)
                      ? `${formatNumber(item.temperature, this.opp.locale)}
                    ${getWeatherUnit(this.opp, "temperature")}`
                      : ""}
                  </div>
                </div>
              `
            )}
          `
        : ""}
      ${this.stateObj.attributes.attribution
        ? html`
            <div class="attribution">
              ${this.stateObj.attributes.attribution}
            </div>
          `
        : ""}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-svg-icon {
        color: var(--paper-item-icon-color);
      }
      .section {
        margin: 16px 0 8px 0;
        font-size: 1.2em;
      }

      .flex {
        display: flex;
        height: 32px;
        align-items: center;
      }

      .main {
        flex: 1;
        margin-left: 24px;
      }

      .temp,
      .templow {
        min-width: 48px;
        text-align: right;
      }

      .templow {
        margin: 0 16px;
        color: var(--secondary-text-color);
      }

      .attribution {
        color: var(--secondary-text-color);
        text-align: center;
      }
    `;
  }

  private _showValue(item: string): boolean {
    return typeof item !== "undefined" && item !== null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-weather": MoreInfoWeather;
  }
}
