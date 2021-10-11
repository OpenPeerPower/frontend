import "@material/mwc-button/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-input/paper-textarea";
import { PaperListboxElement } from "@polymer/paper-listbox";
import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  LitElement,
  property,
} from "lit-element";
import { html } from "lit-html";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/entity/op-entity-toggle";
import "../../../components/ha-card";
import {
  Condition,
  ManualAutomationConfig,
  Trigger,
  triggerAutomationActions,
} from "../../../data/automation";
import { Action, MODES, MODES_MAX } from "../../../data/script";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import "../ha-config-section";
import "./action/ha-automation-action";
import "./condition/ha-automation-condition";
import "./trigger/ha-automation-trigger";

@customElement("manual-automation-editor")
export class HaManualAutomationEditor extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public config!: ManualAutomationConfig;

  @property() public stateObj?: OppEntity;

  protected render() {
    return html`<op-config-section vertical .isWide=${this.isWide}>
        ${!this.narrow
          ? html` <span slot="header">${this.config.alias}</span> `
          : ""}
        <span slot="introduction">
          ${this.opp.localize("ui.panel.config.automation.editor.introduction")}
        </span>
        <op-card>
          <div class="card-content">
            <paper-input
              .label=${this.opp.localize(
                "ui.panel.config.automation.editor.alias"
              )}
              name="alias"
              .value=${this.config.alias}
              @value-changed=${this._valueChanged}
            >
            </paper-input>
            <paper-textarea
              .label=${this.opp.localize(
                "ui.panel.config.automation.editor.description.label"
              )}
              .placeholder=${this.opp.localize(
                "ui.panel.config.automation.editor.description.placeholder"
              )}
              name="description"
              .value=${this.config.description}
              @value-changed=${this._valueChanged}
            ></paper-textarea>
            <p>
              ${this.opp.localize(
                "ui.panel.config.automation.editor.modes.description",
                "documentation_link",
                html`<a
                  href="${documentationUrl(
                    this.opp,
                    "/docs/automation/modes/"
                  )}"
                  target="_blank"
                  rel="noreferrer"
                  >${this.opp.localize(
                    "ui.panel.config.automation.editor.modes.documentation"
                  )}</a
                >`
              )}
            </p>
            <paper-dropdown-menu-light
              .label=${this.opp.localize(
                "ui.panel.config.automation.editor.modes.label"
              )}
              no-animations
            >
              <paper-listbox
                slot="dropdown-content"
                .selected=${this.config.mode
                  ? MODES.indexOf(this.config.mode)
                  : 0}
                @iron-select=${this._modeChanged}
              >
                ${MODES.map(
                  (mode) => html`
                    <paper-item .mode=${mode}>
                      ${this.opp.localize(
                        `ui.panel.config.automation.editor.modes.${mode}`
                      ) || mode}
                    </paper-item>
                  `
                )}
              </paper-listbox>
            </paper-dropdown-menu-light>
            ${this.config.mode && MODES_MAX.includes(this.config.mode)
              ? html`<paper-input
                  .label=${this.opp.localize(
                    `ui.panel.config.automation.editor.max.${this.config.mode}`
                  )}
                  type="number"
                  name="max"
                  .value=${this.config.max || "10"}
                  @value-changed=${this._valueChanged}
                >
                </paper-input>`
              : html``}
          </div>
          ${this.stateObj
            ? html`
                <div class="card-actions layout horizontal justified center">
                  <div class="layout horizontal center">
                    <op-entity-toggle
                      .opp=${this.opp}
                      .stateObj=${this.stateObj!}
                    ></op-entity-toggle>
                    ${this.opp.localize(
                      "ui.panel.config.automation.editor.enable_disable"
                    )}
                  </div>
                  <div>
                    <a href="/config/automation/trace/${this.config.id}">
                      <mwc-button>
                        ${this.opp.localize(
                          "ui.panel.config.automation.editor.show_trace"
                        )}
                      </mwc-button>
                    </a>
                    <mwc-button
                      @click=${this._runActions}
                      .stateObj=${this.stateObj}
                    >
                      ${this.opp.localize("ui.card.automation.trigger")}
                    </mwc-button>
                  </div>
                </div>
              `
            : ""}
        </op-card>
      </op-config-section>

      <op-config-section vertical .isWide=${this.isWide}>
        <span slot="header">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.triggers.header"
          )}
        </span>
        <span slot="introduction">
          <p>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.triggers.introduction"
            )}
          </p>
          <a
            href="${documentationUrl(this.opp, "/docs/automation/trigger/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.editor.triggers.learn_more"
            )}
          </a>
        </span>
        <op-automation-trigger
          .triggers=${this.config.trigger}
          @value-changed=${this._triggerChanged}
          .opp=${this.opp}
        ></op-automation-trigger>
      </op-config-section>

      <op-config-section vertical .isWide=${this.isWide}>
        <span slot="header">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.conditions.header"
          )}
        </span>
        <span slot="introduction">
          <p>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.introduction"
            )}
          </p>
          <a
            href="${documentationUrl(this.opp, "/docs/scripts/conditions/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.learn_more"
            )}
          </a>
        </span>
        <op-automation-condition
          .conditions=${this.config.condition || []}
          @value-changed=${this._conditionChanged}
          .opp=${this.opp}
        ></op-automation-condition>
      </op-config-section>

      <op-config-section vertical .isWide=${this.isWide}>
        <span slot="header">
          ${this.opp.localize(
            "ui.panel.config.automation.editor.actions.header"
          )}
        </span>
        <span slot="introduction">
          <p>
            ${this.opp.localize(
              "ui.panel.config.automation.editor.actions.introduction"
            )}
          </p>
          <a
            href="${documentationUrl(this.opp, "/docs/automation/action/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.editor.actions.learn_more"
            )}
          </a>
        </span>
        <op-automation-action
          .actions=${this.config.action}
          @value-changed=${this._actionChanged}
          .opp=${this.opp}
          .narrow=${this.narrow}
        ></op-automation-action>
      </op-config-section>`;
  }

  private _runActions(ev: Event) {
    triggerAutomationActions(this.opp, (ev.target as any).stateObj.entity_id);
  }

  private _valueChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const target = ev.target as any;
    const name = target.name;
    if (!name) {
      return;
    }
    let newVal = ev.detail.value;
    if (target.type === "number") {
      newVal = Number(newVal);
    }
    if ((this.config![name] || "") === newVal) {
      return;
    }
    fireEvent(this, "value-changed", {
      value: { ...this.config!, [name]: newVal },
    });
  }

  private _modeChanged(ev: CustomEvent) {
    const mode = ((ev.target as PaperListboxElement)?.selectedItem as any)
      ?.mode;

    if (mode === this.config!.mode) {
      return;
    }
    const value = {
      ...this.config!,
      mode,
    };

    if (!MODES_MAX.includes(mode)) {
      delete value.max;
    }

    fireEvent(this, "value-changed", {
      value,
    });
  }

  private _triggerChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.config!, trigger: ev.detail.value as Trigger[] },
    });
  }

  private _conditionChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: {
        ...this.config!,
        condition: ev.detail.value as Condition[],
      },
    });
  }

  private _actionChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.config!, action: ev.detail.value as Action[] },
    });
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        ha-card {
          overflow: hidden;
        }
        span[slot="introduction"] a {
          color: var(--primary-color);
        }
        p {
          margin-bottom: 0;
        }
        op-entity-toggle {
          margin-right: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "manual-automation-editor": HaManualAutomationEditor;
  }
}
