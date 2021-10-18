import "@polymer/paper-input/paper-textarea";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { TemplateTrigger } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import { handleChangeEvent } from "../op-automation-trigger-row";

@customElement("op-automation-trigger-template")
export class HaTemplateTrigger extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trigger!: TemplateTrigger;

  public static get defaultConfig() {
    return { value_template: "" };
  }

  protected render() {
    const { value_template } = this.trigger;
    return html`
      <paper-textarea
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.template.value_template"
        )}
        name="value_template"
        .value=${value_template}
        @value-changed=${this._valueChanged}
        dir="ltr"
      ></paper-textarea>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }
}
