import "@polymer/paper-input/paper-input";
import "@polymer/paper-input/paper-textarea";
import { customElement, LitElement, property } from "lit-element";
import { html } from "lit-html";
import { fireEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/ha-formfield";
import { WaitForTriggerAction } from "../../../../../data/script";
import { OpenPeerPower } from "../../../../../types";
import "../../trigger/ha-automation-trigger";
import { ActionElement, handleChangeEvent } from "../ha-automation-action-row";

@customElement("ha-automation-action-wait_for_trigger")
export class HaWaitForTriggerAction
  extends LitElement
  implements ActionElement
{
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: WaitForTriggerAction;

  public static get defaultConfig() {
    return { wait_for_trigger: [] };
  }

  protected render() {
    const { wait_for_trigger, continue_on_timeout, timeout } = this.action;

    return html`
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.wait_for_trigger.timeout"
        )}
        .name=${"timeout"}
        .value=${timeout}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <br />
      <op-formfield
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.wait_for_trigger.continue_timeout"
        )}
      >
        <op-switch
          .checked=${continue_on_timeout ?? true}
          @change=${this._continueChanged}
        ></op-switch>
      </op-formfield>
      <op-automation-trigger
        .triggers=${wait_for_trigger}
        .opp=${this.opp}
        .name=${"wait_for_trigger"}
        @value-changed=${this._valueChanged}
      ></op-automation-trigger>
    `;
  }

  private _continueChanged(ev) {
    fireEvent(this, "value-changed", {
      value: { ...this.action, continue_on_timeout: ev.target.checked },
    });
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-action-wait_for_trigger": HaWaitForTriggerAction;
  }
}
