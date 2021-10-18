import { customElement, html, LitElement, property } from "lit-element";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { Condition } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import "../../condition/op-automation-condition-editor";
import { ActionElement } from "../op-automation-action-row";

@customElement("op-automation-action-condition")
export class HaConditionAction extends LitElement implements ActionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: Condition;

  public static get defaultConfig() {
    return { condition: "state" };
  }

  protected render() {
    return html`
      <op-automation-condition-editor
        .condition=${this.action}
        .opp=${this.opp}
        @value-changed=${this._conditionChanged}
      ></op-automation-condition-editor>
    `;
  }

  private _conditionChanged(ev: CustomEvent) {
    ev.stopPropagation();

    fireEvent(this, "value-changed", {
      value: ev.detail.value,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-action-condition": HaConditionAction;
  }
}
