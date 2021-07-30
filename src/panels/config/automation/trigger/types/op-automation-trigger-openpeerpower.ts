import "@polymer/paper-radio-button/paper-radio-button";
import "@polymer/paper-radio-group/paper-radio-group";
import type { PaperRadioGroupElement } from "@polymer/paper-radio-group/paper-radio-group";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { fireEvent } from "../../../../../common/dom/fire_event";
import type { OppTrigger } from "../../../../../data/automation";
import type { OpenPeerPower } from "../../../../../types";

@customElement("ha-automation-trigger-openpeerpower")
export default class HaOppTrigger extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trigger!: OppTrigger;

  public static get defaultConfig() {
    return {
      event: "start",
    };
  }

  protected render() {
    const { event } = this.trigger;
    return html`
      <label id="eventlabel">
        ${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.openpeerpower.event"
        )}
      </label>
      <paper-radio-group
        .selected=${event}
        aria-labelledby="eventlabel"
        @paper-radio-group-changed="${this._radioGroupPicked}"
      >
        <paper-radio-button name="start">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.triggers.type.openpeerpower.start"
          )}
        </paper-radio-button>
        <paper-radio-button name="shutdown">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.triggers.type.openpeerpower.shutdown"
          )}
        </paper-radio-button>
      </paper-radio-group>
    `;
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

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-trigger-openpeerpower": HaOppTrigger;
  }
}
