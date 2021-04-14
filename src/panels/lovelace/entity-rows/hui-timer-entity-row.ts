import { OppEntity } from "openpeerpower-js-websocket";
import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import secondsToDuration from "../../../common/datetime/seconds_to_duration";
import { timerTimeRemaining } from "../../../common/entity/timer_time_remaining";
import { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { EntityConfig } from "./types";

@customElement("hui-timer-entity-row")
class HuiTimerEntityRow extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntityConfig;

  @internalProperty() private _timeRemaining?: number;

  private _interval?: number;

  public setConfig(config: EntityConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearInterval();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this._config && this._config.entity) {
      const stateObj = this.opp?.states[this._config!.entity];
      if (stateObj) {
        this._startInterval(stateObj);
      }
    }
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
        <div class="text-content">${this._computeDisplay(stateObj)}</div>
      </hui-generic-entity-row>
    `;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has("_timeRemaining")) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if (changedProps.has("opp")) {
      const stateObj = this.opp!.states[this._config!.entity];
      const oldOpp = changedProps.get("opp") as this["opp"];
      const oldStateObj = oldOpp
        ? oldOpp.states[this._config!.entity]
        : undefined;

      if (oldStateObj !== stateObj) {
        this._startInterval(stateObj);
      } else if (!stateObj) {
        this._clearInterval();
      }
    }
  }

  private _clearInterval(): void {
    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private _startInterval(stateObj: OppEntity): void {
    this._clearInterval();
    this._calculateRemaining(stateObj);

    if (stateObj.state === "active") {
      this._interval = window.setInterval(
        () => this._calculateRemaining(stateObj),
        1000
      );
    }
  }

  private _calculateRemaining(stateObj: OppEntity): void {
    this._timeRemaining = timerTimeRemaining(stateObj);
  }

  private _computeDisplay(stateObj: OppEntity): string | null {
    if (!stateObj) {
      return null;
    }

    if (stateObj.state === "idle" || this._timeRemaining === 0) {
      return (
        this.opp!.localize(`state.timer.${stateObj.state}`) || stateObj.state
      );
    }

    let display = secondsToDuration(this._timeRemaining || 0);

    if (stateObj.state === "paused") {
      display += ` (${this.opp!.localize("state.timer.paused")})`;
    }

    return display;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-timer-entity-row": HuiTimerEntityRow;
  }
}
