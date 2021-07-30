import "@polymer/paper-input/paper-input";
import "@polymer/paper-input/paper-textarea";
import { customElement, html, LitElement, property } from "lit-element";
import "../../../../../components/entity/ha-entity-picker";
import { NumericStateCondition } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import { handleChangeEvent } from "../ha-automation-condition-row";

@customElement("ha-automation-condition-numeric_state")
export default class HaNumericStateCondition extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public condition!: NumericStateCondition;

  public static get defaultConfig() {
    return {
      entity_id: "",
    };
  }

  public render() {
    const { value_template, entity_id, attribute, below, above } =
      this.condition;

    return html`
      <op-entity-picker
        .value=${entity_id}
        .name=${"entity_id"}
        @value-changed=${this._valueChanged}
        .opp=${this.opp}
        allow-custom-entity
      ></op-entity-picker>
      <op-entity-attribute-picker
        .opp=${this.opp}
        .entityId=${entity_id}
        .value=${attribute}
        .name=${"attribute"}
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.triggers.type.state.attribute"
        )}
        @value-changed=${this._valueChanged}
        allow-custom-value
      ></op-entity-attribute-picker>
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.numeric_state.above"
        )}
        name="above"
        .value=${above}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.numeric_state.below"
        )}
        name="below"
        .value=${below}
        @value-changed=${this._valueChanged}
      ></paper-input>
      <paper-textarea
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.conditions.type.numeric_state.value_template"
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

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-condition-numeric_state": HaNumericStateCondition;
  }
}
