import "@polymer/paper-input/paper-input";
import "@polymer/paper-radio-button/paper-radio-button";
import "@polymer/paper-radio-group/paper-radio-group";
import type { PaperRadioGroupElement } from "@polymer/paper-radio-group/paper-radio-group";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../../../../common/dom/fire_event";
import type { SunTrigger } from "../../../../../data/automation";
import type { OpenPeerPower } from "../../../../../types";
import {
  handleChangeEvent,
  TriggerElement,
} from "../op-automation-trigger-row";

@customElement("op-automation-trigger-sun")
export class HaSunTrigger extends LitElement implements TriggerElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trigger!: SunTrigger;

  public static get defaultConfig() {
    return {
      event: "sunrise",
    };
  }

  protected render() {
    const { offset, event } = this.trigger;
    return html`
      <label id="eventlabel">
        ${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.sun.event"
        )}
      </label>
      <paper-radio-group
        .selected=${event}
        aria-labelledby="eventlabel"
        @paper-radio-group-changed=${this._radioGroupPicked}
      >
        <paper-radio-button name="sunrise">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.triggers.type.sun.sunrise"
          )}
        </paper-radio-button>
        <paper-radio-button name="sunset">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.triggers.type.sun.sunset"
          )}
        </paper-radio-button>
      </paper-radio-group>

      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.sun.offset"
        )}
        name="offset"
        .value=${offset}
        @value-changed=${this._valueChanged}
      ></paper-input>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }

  private _radioGroupPicked(ev) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: {
        ...this.trigger,
        event: (ev.target as PaperRadioGroupElement).selected,
      },
    });
  }
}
