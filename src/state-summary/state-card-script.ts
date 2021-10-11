import "@material/mwc-button";
import { OppEntity } from "openpeerpower-js-websocket";
import {
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
} from "lit-element";
import "../components/entity/op-entity-toggle";
import "../components/entity/state-info";
import { UNAVAILABLE_STATES } from "../data/entity";
import { canRun, ScriptEntity } from "../data/script";
import { haStyle } from "../resources/styles";
import { OpenPeerPower } from "../types";

@customElement("state-card-script")
export class StateCardScript extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj!: OppEntity;

  @property({ type: Boolean }) public inDialog = false;

  protected render() {
    const stateObj = this.stateObj as ScriptEntity;
    return html`
      <div class="horizontal justified layout">
        <state-info
          .opp=${this.opp}
          .stateObj=${stateObj}
          .inDialog=${this.inDialog}
        ></state-info>
        ${stateObj.state === "on"
          ? html`<mwc-button @click=${this._cancelScript}>
              ${stateObj.attributes.mode !== "single" &&
              (stateObj.attributes.current || 0) > 0
                ? this.opp.localize(
                    "ui.card.script.cancel_multiple",
                    "number",
                    stateObj.attributes.current
                  )
                : this.opp.localize("ui.card.script.cancel")}
            </mwc-button>`
          : ""}
        ${stateObj.state === "off" || stateObj.attributes.max
          ? html`<mwc-button
              @click=${this._runScript}
              .disabled=${UNAVAILABLE_STATES.includes(stateObj.state) ||
              !canRun(stateObj)}
            >
              ${this.opp!.localize("ui.card.script.run")}
            </mwc-button>`
          : ""}
      </div>
    `;
  }

  private _cancelScript(ev: Event) {
    ev.stopPropagation();
    this._callService("turn_off");
  }

  private _runScript(ev: Event) {
    ev.stopPropagation();
    this._callService("turn_on");
  }

  private _callService(service: string): void {
    this.opp.callService("script", service, {
      entity_id: this.stateObj.entity_id,
    });
  }

  static get styles(): CSSResult {
    return haStyle;
  }
}
