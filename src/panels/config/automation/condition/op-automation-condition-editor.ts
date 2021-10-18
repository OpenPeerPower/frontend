import "@polymer/paper-dropdown-menu/paper-dropdown-menu-light";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import type { PaperListboxElement } from "@polymer/paper-listbox/paper-listbox";
import {
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
} from "lit-element";
import { dynamicElement } from "../../../../common/dom/dynamic-element-directive";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/op-card";
import "../../../../components/op-yaml-editor";
import type { Condition } from "../../../../data/automation";
import { haStyle } from "../../../../resources/styles";
import type { OpenPeerPower } from "../../../../types";
import "./types/op-automation-condition-and";
import "./types/op-automation-condition-device";
import "./types/op-automation-condition-not";
import "./types/op-automation-condition-numeric_state";
import "./types/op-automation-condition-or";
import "./types/op-automation-condition-state";
import "./types/op-automation-condition-sun";
import "./types/op-automation-condition-template";
import "./types/op-automation-condition-time";
import "./types/op-automation-condition-zone";

const OPTIONS = [
  "device",
  "and",
  "or",
  "not",
  "state",
  "numeric_state",
  "sun",
  "template",
  "time",
  "zone",
];

@customElement("op-automation-condition-editor")
export default class HaAutomationConditionEditor extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public condition!: Condition;

  @property() public yamlMode = false;

  protected render() {
    const selected = OPTIONS.indexOf(this.condition.condition);
    const yamlMode = this.yamlMode || selected === -1;
    return html`
      ${yamlMode
        ? html`
            ${selected === -1
              ? html`
                  ${this.opp.localize(
                    "ui.panel.config.automation.editor.conditions.unsupported_condition",
                    "condition",
                    this.condition.condition
                  )}
                `
              : ""}
            <h2>
              ${this.opp.localize(
                "ui.panel.config.automation.editor.edit_yaml"
              )}
            </h2>
            <op-yaml-editor
              .defaultValue=${this.condition}
              @value-changed=${this._onYamlChange}
            ></op-yaml-editor>
          `
        : html`
            <paper-dropdown-menu-light
              .label=${this.opp.localize(
                "ui.panel.config.automation.editor.conditions.type_select"
              )}
              no-animations
            >
              <paper-listbox
                slot="dropdown-content"
                .selected=${selected}
                @iron-select=${this._typeChanged}
              >
                ${OPTIONS.map(
                  (opt) => html`
                    <paper-item .condition=${opt}>
                      ${this.opp.localize(
                        `ui.panel.config.automation.editor.conditions.type.${opt}.label`
                      )}
                    </paper-item>
                  `
                )}
              </paper-listbox>
            </paper-dropdown-menu-light>
            <div>
              ${dynamicElement(
                `op-automation-condition-${this.condition.condition}`,
                { opp: this.opp, condition: this.condition }
              )}
            </div>
          `}
    `;
  }

  private _typeChanged(ev: CustomEvent) {
    const type = ((ev.target as PaperListboxElement)?.selectedItem as any)
      ?.condition;

    if (!type) {
      return;
    }

    const elClass = customElements.get(`op-automation-condition-${type}`);

    if (type !== this.condition.condition) {
      fireEvent(this, "value-changed", {
        value: {
          condition: type,
          ...elClass.defaultConfig,
        },
      });
    }
  }

  private _onYamlChange(ev: CustomEvent) {
    ev.stopPropagation();
    if (!ev.detail.isValid) {
      return;
    }
    fireEvent(this, "value-changed", { value: ev.detail.value });
  }

  static get styles(): CSSResult {
    return haStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-editor": HaAutomationConditionEditor;
  }
}
