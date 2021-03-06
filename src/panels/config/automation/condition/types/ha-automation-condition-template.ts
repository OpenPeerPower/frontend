import "@polymer/paper-input/paper-textarea";
import { customElement, html, LitElement, property } from "lit-element";
import { TemplateCondition } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import { handleChangeEvent } from "../ha-automation-condition-row";

@customElement("ha-automation-condition-template")
export class HaTemplateCondition extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public condition!: TemplateCondition;

  public static get defaultConfig() {
    return { value_template: "" };
  }

  protected render() {
    const { value_template } = this.condition;
    return html`
      <paper-textarea
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.template.value_template"
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
