import "@material/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
} from "lit-element";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/op-card";
import { Action } from "../../../../data/script";
import { OpenPeerPower } from "../../../../types";
import "./ha-automation-action-row";
import { HaDeviceAction } from "./types/ha-automation-action-device_id";

@customElement("ha-automation-action")
export default class HaAutomationAction extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public narrow = false;

  @property() public actions!: Action[];

  protected render() {
    return html`
      ${this.actions.map(
        (action, idx) => html`
          <op-automation-action-row
            .index=${idx}
            .totalActions=${this.actions.length}
            .action=${action}
            .narrow=${this.narrow}
            @duplicate=${this._duplicateAction}
            @move-action=${this._move}
            @value-changed=${this._actionChanged}
            .opp=${this.opp}
          ></op-automation-action-row>
        `
      )}
      <op-card>
        <div class="card-actions add-card">
          <mwc-button @click=${this._addAction}>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.actions.add"
            )}
          </mwc-button>
        </div>
      </op-card>
    `;
  }

  private _addAction() {
    const actions = this.actions.concat({
      ...HaDeviceAction.defaultConfig,
    });

    fireEvent(this, "value-changed", { value: actions });
  }

  private _move(ev: CustomEvent) {
    const index = (ev.target as any).index;
    const newIndex = ev.detail.direction === "up" ? index - 1 : index + 1;
    const actions = this.actions.concat();
    const action = actions.splice(index, 1)[0];
    actions.splice(newIndex, 0, action);
    fireEvent(this, "value-changed", { value: actions });
  }

  private _actionChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const actions = [...this.actions];
    const newValue = ev.detail.value;
    const index = (ev.target as any).index;

    if (newValue === null) {
      actions.splice(index, 1);
    } else {
      actions[index] = newValue;
    }

    fireEvent(this, "value-changed", { value: actions });
  }

  private _duplicateAction(ev: CustomEvent) {
    ev.stopPropagation();
    const index = (ev.target as any).index;
    fireEvent(this, "value-changed", {
      value: this.actions.concat(this.actions[index]),
    });
  }

  static get styles(): CSSResult {
    return css`
      ha-automation-action-row,
      op-card {
        display: block;
        margin-top: 16px;
      }
      .add-card mwc-button {
        display: block;
        text-align: center;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-action": HaAutomationAction;
  }
}
