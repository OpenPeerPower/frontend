import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, state } from "lit/decorators";
import { STATES_OFF } from "../../common/const";
import { computeStateDomain } from "../../common/entity/compute_state_domain";
import { computeStateName } from "../../common/entity/compute_state_name";
import { UNAVAILABLE, UNAVAILABLE_STATES } from "../../data/entity";
import { forwardHaptic } from "../../data/haptics";
import { OpenPeerPower } from "../../types";
import "../ha-formfield";
import "../ha-icon-button";
import "../ha-switch";

const isOn = (stateObj?: OppEntity) =>
  stateObj !== undefined &&
  !STATES_OFF.includes(stateObj.state) &&
  !UNAVAILABLE_STATES.includes(stateObj.state);

export class HaEntityToggle extends LitElement {
  // opp is not a property so that we only re-render on stateObj changes
  public opp?: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  @property() public label?: string;

  @state() private _isOn = false;

  protected render(): TemplateResult {
    if (!this.stateObj) {
      return html` <op-switch disabled></op-switch> `;
    }

    if (this.stateObj.attributes.assumed_state) {
      return html`
        <op-icon-button
          aria-label=${`Turn ${computeStateName(this.stateObj)} off`}
          icon="opp:flash-off"
          .disabled=${this.stateObj.state === UNAVAILABLE}
          @click=${this._turnOff}
          ?state-active=${!this._isOn}
        ></op-icon-button>
        <op-icon-button
          aria-label=${`Turn ${computeStateName(this.stateObj)} on`}
          icon="opp:flash"
          .disabled=${this.stateObj.state === UNAVAILABLE}
          @click=${this._turnOn}
          ?state-active=${this._isOn}
        ></op-icon-button>
      `;
    }

    const switchTemplate = html`<op-switch
      aria-label=${`Toggle ${computeStateName(this.stateObj)} ${
        this._isOn ? "off" : "on"
      }`}
      .checked=${this._isOn}
      .disabled=${UNAVAILABLE_STATES.includes(this.stateObj.state)}
      @change=${this._toggleChanged}
    ></op-switch>`;

    if (!this.label) {
      return switchTemplate;
    }

    return html`
      <op-formfield .label=${this.label}>${switchTemplate}</op-formfield>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.addEventListener("click", (ev) => ev.stopPropagation());
  }

  public willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (changedProps.has("stateObj")) {
      this._isOn = isOn(this.stateObj);
    }
  }

  private _toggleChanged(ev) {
    const newVal = ev.target.checked;

    if (newVal !== this._isOn) {
      this._callService(newVal);
    }
  }

  private _turnOn() {
    this._callService(true);
  }

  private _turnOff() {
    this._callService(false);
  }

  // We will force a re-render after a successful call to re-sync the toggle
  // with the state. It will be out of sync if our service call did not
  // result in the entity to be turned on. Since the state is not changing,
  // the resync is not called automatic.
  private async _callService(turnOn): Promise<void> {
    if (!this.opp || !this.stateObj) {
      return;
    }
    forwardHaptic("light");
    const stateDomain = computeStateDomain(this.stateObj);
    let serviceDomain;
    let service;

    if (stateDomain === "lock") {
      serviceDomain = "lock";
      service = turnOn ? "unlock" : "lock";
    } else if (stateDomain === "cover") {
      serviceDomain = "cover";
      service = turnOn ? "open_cover" : "close_cover";
    } else if (stateDomain === "group") {
      serviceDomain = "openpeerpower";
      service = turnOn ? "turn_on" : "turn_off";
    } else {
      serviceDomain = stateDomain;
      service = turnOn ? "turn_on" : "turn_off";
    }

    const currentState = this.stateObj;

    // Optimistic update.
    this._isOn = turnOn;

    await this.opp.callService(serviceDomain, service, {
      entity_id: this.stateObj.entity_id,
    });

    setTimeout(async () => {
      // If after 2 seconds we have not received a state update
      // reset the switch to it's original state.
      if (this.stateObj === currentState) {
        this._isOn = isOn(this.stateObj);
      }
    }, 2000);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        white-space: nowrap;
        min-width: 38px;
      }
      ha-icon-button {
        color: var(--ha-icon-button-inactive-color, var(--primary-text-color));
        transition: color 0.5s;
      }
      ha-icon-button[state-active] {
        color: var(--ha-icon-button-active-color, var(--primary-color));
      }
      ha-switch {
        padding: 13px 5px;
      }
    `;
  }
}

customElements.define("ha-entity-toggle", HaEntityToggle);
