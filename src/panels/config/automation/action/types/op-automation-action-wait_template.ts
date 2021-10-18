import "@polymer/paper-input/paper-input";
import "@polymer/paper-input/paper-textarea";
import { customElement, LitElement, property } from "lit-element";
import { html } from "lit-html";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { WaitAction } from "../../../../../data/script";
import { OpenPeerPower } from "../../../../../types";
import { ActionElement, handleChangeEvent } from "../op-automation-action-row";

@customElement("op-automation-action-wait_template")
export class HaWaitAction extends LitElement implements ActionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: WaitAction;

  public static get defaultConfig() {
    return { wait_template: "" };
  }

  protected render() {
    const { wait_template, timeout, continue_on_timeout } = this.action;

    return html`
      <paper-textarea
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.wait_template.wait_template"
        )}
        name="wait_template"
        .value=${wait_template}
        @value-changed=${this._valueChanged}
        dir="ltr"
      ></paper-textarea>
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.wait_template.timeout"
        )}
        .name=${"timeout"}
        .value=${timeout}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <br />
      <op-formfield
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.wait_template.continue_timeout"
        )}
      >
        <op-switch
          .checked=${continue_on_timeout}
          @change=${this._continueChanged}
        ></op-switch>
      </op-formfield>
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
    "op-automation-action-wait_template": HaWaitAction;
  }
}
