import { OppEntity } from "openpeerpower-js-websocket";
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
import secondsToDuration from "../../common/datetime/seconds_to_duration";
import { computeStateDisplay } from "../../common/entity/compute_state_display";
import { computeStateDomain } from "../../common/entity/compute_state_domain";
import { computeStateName } from "../../common/entity/compute_state_name";
import { domainIcon } from "../../common/entity/domain_icon";
import { stateIcon } from "../../common/entity/state_icon";
import { timerTimeRemaining } from "../../common/entity/timer_time_remaining";
import { formatNumber } from "../../common/string/format_number";
import { UNAVAILABLE, UNKNOWN } from "../../data/entity";
import { OpenPeerPower } from "../../types";
import "../ha-label-badge";

@customElement("ha-state-label-badge")
export class HaStateLabelBadge extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public state?: OppEntity;

  @property() public name?: string;

  @property() public icon?: string;

  @property() public image?: string;

  @internalProperty() private _timerTimeRemaining?: number;

  private _connected?: boolean;

  private _updateRemaining?: number;

  public connectedCallback(): void {
    super.connectedCallback();
    this._connected = true;
    this.startInterval(this.state);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._connected = false;
    this.clearInterval();
  }

  protected render(): TemplateResult {
    const state = this.state;

    if (!state) {
      return html`
        <ha-label-badge
          class="warning"
          label="${this.opp!.localize("state_badge.default.error")}"
          icon="opp:alert"
          description="${this.opp!.localize(
            "state_badge.default.entity_not_found"
          )}"
        ></ha-label-badge>
      `;
    }

    const domain = computeStateDomain(state);

    return html`
      <ha-label-badge
        class="${classMap({
          [domain]: true,
          "has-unit_of_measurement": "unit_of_measurement" in state.attributes,
        })}"
        .value="${this._computeValue(domain, state)}"
        .icon="${this.icon ? this.icon : this._computeIcon(domain, state)}"
        .image="${this.icon
          ? ""
          : this.image
          ? this.image
          : state.attributes.entity_picture_local ||
            state.attributes.entity_picture}"
        .label="${this._computeLabel(domain, state, this._timerTimeRemaining)}"
        .description="${this.name ? this.name : computeStateName(state)}"
      ></ha-label-badge>
    `;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (this._connected && changedProperties.has("state")) {
      this.startInterval(this.state);
    }
  }

  private _computeValue(domain: string, state: OppEntity) {
    switch (domain) {
      case "binary_sensor":
      case "device_tracker":
      case "person":
      case "updater":
      case "sun":
      case "alarm_control_panel":
      case "timer":
        return null;
      case "sensor":
      default:
        return state.attributes.device_class === "moon__phase"
          ? null
          : state.state === UNKNOWN
          ? "-"
          : state.attributes.unit_of_measurement
          ? formatNumber(state.state, this.opp!.locale)
          : computeStateDisplay(this.opp!.localize, state, this.opp!.locale);
    }
  }

  private _computeIcon(domain: string, state: OppEntity) {
    if (state.state === UNAVAILABLE) {
      return null;
    }
    switch (domain) {
      case "alarm_control_panel":
        if (state.state === "pending") {
          return "opp:clock-fast";
        }
        if (state.state === "armed_away") {
          return "opp:nature";
        }
        if (state.state === "armed_home") {
          return "opp:home-variant";
        }
        if (state.state === "armed_night") {
          return "opp:weather-night";
        }
        if (state.state === "armed_custom_bypass") {
          return "opp:shield-home";
        }
        if (state.state === "triggered") {
          return "opp:alert-circle";
        }
        // state == 'disarmed'
        return domainIcon(domain, state);
      case "binary_sensor":
      case "device_tracker":
      case "updater":
      case "person":
      case "sun":
        return stateIcon(state);
      case "timer":
        return state.state === "active"
          ? "opp:timer-outline"
          : "opp:timer-off-outline";
      default:
        return state?.attributes.device_class === "moon__phase"
          ? stateIcon(state)
          : null;
    }
  }

  private _computeLabel(domain, state, _timerTimeRemaining) {
    if (
      state.state === UNAVAILABLE ||
      ["device_tracker", "alarm_control_panel", "person"].includes(domain)
    ) {
      // Localize the state with a special state_badge namespace, which has variations of
      // the state translations that are truncated to fit within the badge label. Translations
      // are only added for device_tracker, alarm_control_panel and person.
      return (
        this.opp!.localize(`state_badge.${domain}.${state.state}`) ||
        this.opp!.localize(`state_badge.default.${state.state}`) ||
        state.state
      );
    }
    if (domain === "timer") {
      return secondsToDuration(_timerTimeRemaining);
    }
    return state.attributes.unit_of_measurement || null;
  }

  private clearInterval() {
    if (this._updateRemaining) {
      clearInterval(this._updateRemaining);
      this._updateRemaining = undefined;
    }
  }

  private startInterval(stateObj) {
    this.clearInterval();
    if (stateObj && computeStateDomain(stateObj) === "timer") {
      this.calculateTimerRemaining(stateObj);

      if (stateObj.state === "active") {
        this._updateRemaining = window.setInterval(
          () => this.calculateTimerRemaining(this.state),
          1000
        );
      }
    }
  }

  private calculateTimerRemaining(stateObj) {
    this._timerTimeRemaining = timerTimeRemaining(stateObj);
  }

  static get styles(): CSSResult {
    return css`
      :host {
        cursor: pointer;
      }

      ha-label-badge {
        --op-label-badge-color: var(--label-badge-red, #df4c1e);
      }
      ha-label-badge.has-unit_of_measurement {
        --op-label-badge-label-text-transform: none;
      }

      ha-label-badge.binary_sensor,
      ha-label-badge.updater {
        --op-label-badge-color: var(--label-badge-blue, #039be5);
      }

      .red {
        --op-label-badge-color: var(--label-badge-red, #df4c1e);
      }

      .blue {
        --op-label-badge-color: var(--label-badge-blue, #039be5);
      }

      .green {
        --op-label-badge-color: var(--label-badge-green, #0da035);
      }

      .yellow {
        --op-label-badge-color: var(--label-badge-yellow, #f4b400);
      }

      .grey {
        --op-label-badge-color: var(--label-badge-grey, var(--paper-grey-500));
      }

      .warning {
        --op-label-badge-color: var(--label-badge-yellow, #fce588);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-state-label-badge": HaStateLabelBadge;
  }
}
