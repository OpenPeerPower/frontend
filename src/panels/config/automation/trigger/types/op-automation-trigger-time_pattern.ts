import "@polymer/paper-input/paper-input";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { TimePatternTrigger } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import {
  handleChangeEvent,
  TriggerElement,
} from "../op-automation-trigger-row";

@customElement("op-automation-trigger-time_pattern")
export class HaTimePatternTrigger extends LitElement implements TriggerElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trigger!: TimePatternTrigger;

  public static get defaultConfig() {
    return {};
  }

  protected render() {
    const { hours, minutes, seconds } = this.trigger;
    return html`
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.time_pattern.hours"
        )}
        name="hours"
        .value=${hours}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.time_pattern.minutes"
        )}
        name="minutes"
        .value=${minutes}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.time_pattern.seconds"
        )}
        name="seconds"
        .value=${seconds}
        @value-changed=${this._valueChanged}
      ></paper-input>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-trigger-time_pattern": HaTimePatternTrigger;
  }
}
