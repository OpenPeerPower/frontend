import { mdiDelete } from "@mdi/js";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResult,
  customElement,
  LitElement,
  property,
} from "lit-element";
import { html } from "lit-html";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { Condition } from "../../../../../data/automation";
import { Action, ChooseAction } from "../../../../../data/script";
import { haStyle } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import "../ha-automation-action";
import { ActionElement } from "../ha-automation-action-row";

@customElement("ha-automation-action-choose")
export class HaChooseAction extends LitElement implements ActionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: ChooseAction;

  public static get defaultConfig() {
    return { choose: [{ conditions: [], sequence: [] }], default: [] };
  }

  protected render() {
    const action = this.action;

    return html`
      ${(action.choose || []).map(
        (option, idx) => html`<op-card>
          <mwc-icon-button
            .idx=${idx}
            @click=${this._removeOption}
            title=${this.opp.localize(
              "ui.panel.config.automation.editor.actions.type.choose.remove_option"
            )}
          >
            <op-svg-icon .path=${mdiDelete}></op-svg-icon>
          </mwc-icon-button>
          <div class="card-content">
            <h2>
              ${this.opp.localize(
                "ui.panel.config.automation.editor.actions.type.choose.option",
                "number",
                idx + 1
              )}:
            </h2>
            <h3>
              ${this.opp.localize(
                "ui.panel.config.automation.editor.actions.type.choose.conditions"
              )}:
            </h3>
            <op-automation-condition
              .conditions=${option.conditions}
              .opp=${this.opp}
              .idx=${idx}
              @value-changed=${this._conditionChanged}
            ></op-automation-condition>
            <h3>
              ${this.opp.localize(
                "ui.panel.config.automation.editor.actions.type.choose.sequence"
              )}:
            </h3>
            <op-automation-action
              .actions=${option.sequence}
              .opp=${this.opp}
              .idx=${idx}
              @value-changed=${this._actionChanged}
            ></op-automation-action>
          </div>
        </op-card>`
      )}
      <op-card>
        <div class="card-actions add-card">
          <mwc-button @click=${this._addOption}>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.actions.type.choose.add_option"
            )}
          </mwc-button>
        </div>
      </op-card>
      <h2>
        ${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.choose.default"
        )}:
      </h2>
      <op-automation-action
        .actions=${action.default || []}
        @value-changed=${this._defaultChanged}
        .opp=${this.opp}
      ></op-automation-action>
    `;
  }

  private _conditionChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const value = ev.detail.value as Condition[];
    const index = (ev.target as any).idx;
    const choose = this.action.choose ? [...this.action.choose] : [];
    choose[index].conditions = value;
    fireEvent(this, "value-changed", {
      value: { ...this.action, choose },
    });
  }

  private _actionChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const value = ev.detail.value as Action[];
    const index = (ev.target as any).idx;
    const choose = this.action.choose ? [...this.action.choose] : [];
    choose[index].sequence = value;
    fireEvent(this, "value-changed", {
      value: { ...this.action, choose },
    });
  }

  private _addOption() {
    const choose = this.action.choose ? [...this.action.choose] : [];
    choose.push({ conditions: [], sequence: [] });
    fireEvent(this, "value-changed", {
      value: { ...this.action, choose },
    });
  }

  private _removeOption(ev: CustomEvent) {
    const index = (ev.currentTarget as any).idx;
    const choose = this.action.choose ? [...this.action.choose] : [];
    choose.splice(index, 1);
    fireEvent(this, "value-changed", {
      value: { ...this.action, choose },
    });
  }

  private _defaultChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const value = ev.detail.value as Action[];
    fireEvent(this, "value-changed", {
      value: {
        ...this.action,
        default: value,
      },
    });
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        op-card {
          margin-top: 16px;
        }
        .add-card mwc-button {
          display: block;
          text-align: center;
        }
        mwc-icon-button {
          position: absolute;
          right: 0;
          padding: 4px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-action-choose": HaChooseAction;
  }
}
