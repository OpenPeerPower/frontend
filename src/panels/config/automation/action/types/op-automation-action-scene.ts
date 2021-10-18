import { customElement, html, LitElement, property } from "lit-element";
import { fireEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/entity/op-entity-picker";
import { SceneAction } from "../../../../../data/script";
import { PolymerChangedEvent } from "../../../../../polymer-types";
import { OpenPeerPower } from "../../../../../types";
import { ActionElement } from "../op-automation-action-row";

const includeDomains = ["scene"];

@customElement("op-automation-action-scene")
export class HaSceneAction extends LitElement implements ActionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: SceneAction;

  public static get defaultConfig(): SceneAction {
    return { scene: "" };
  }

  protected render() {
    const { scene } = this.action;

    return html`
      <op-entity-picker
        .opp=${this.opp}
        .value=${scene}
        @value-changed=${this._entityPicked}
        .includeDomains=${includeDomains}
        allow-custom-entity
      ></op-entity-picker>
    `;
  }

  private _entityPicked(ev: PolymerChangedEvent<string>) {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.action, scene: ev.detail.value },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-action-scene": HaSceneAction;
  }
}
