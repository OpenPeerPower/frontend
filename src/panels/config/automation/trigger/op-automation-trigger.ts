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
import { Trigger } from "../../../../data/automation";
import { OpenPeerPower } from "../../../../types";
import "./op-automation-trigger-row";
import { HaDeviceTrigger } from "./types/op-automation-trigger-device";

@customElement("op-automation-trigger")
export default class HaAutomationTrigger extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public triggers!: Trigger[];

  protected render() {
    return html`
      ${this.triggers.map(
        (trg, idx) => html`
          <op-automation-trigger-row
            .index=${idx}
            .trigger=${trg}
            @duplicate=${this._duplicateTrigger}
            @value-changed=${this._triggerChanged}
            .opp=${this.opp}
          ></op-automation-trigger-row>
        `
      )}
      <op-card>
        <div class="card-actions add-card">
          <mwc-button @click=${this._addTrigger}>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.triggers.add"
            )}
          </mwc-button>
        </div>
      </op-card>
    `;
  }

  private _addTrigger() {
    const triggers = this.triggers.concat({
      platform: "device",
      ...HaDeviceTrigger.defaultConfig,
    });

    fireEvent(this, "value-changed", { value: triggers });
  }

  private _triggerChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const triggers = [...this.triggers];
    const newValue = ev.detail.value;
    const index = (ev.target as any).index;

    if (newValue === null) {
      triggers.splice(index, 1);
    } else {
      triggers[index] = newValue;
    }

    fireEvent(this, "value-changed", { value: triggers });
  }

  private _duplicateTrigger(ev: CustomEvent) {
    ev.stopPropagation();
    const index = (ev.target as any).index;
    fireEvent(this, "value-changed", {
      value: this.triggers.concat(this.triggers[index]),
    });
  }

  static get styles(): CSSResult {
    return css`
      op-automation-trigger-row,
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
    "op-automation-trigger": HaAutomationTrigger;
  }
}
