import { customElement, html, LitElement, property } from "lit-element";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { LogicalCondition } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import "../op-automation-condition";
import { ConditionElement } from "../op-automation-condition-row";

@customElement("op-automation-condition-logical")
export class HaLogicalCondition extends LitElement implements ConditionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public condition!: LogicalCondition;

  public static get defaultConfig() {
    return { conditions: [{ condition: "state" }] };
  }

  protected render() {
    return html`
      <op-automation-condition
        .conditions=${this.condition.conditions || []}
        @value-changed=${this._valueChanged}
        .opp=${this.opp}
      ></op-automation-condition>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.condition, conditions: ev.detail.value },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-logical": HaLogicalCondition;
  }
}
