import "@polymer/paper-input/paper-input";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { assert } from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import { computeDomain } from "../../../../common/entity/compute_domain";
import { stateIcon } from "../../../../common/entity/state_icon";
import "../../../../components/ha-formfield";
import "../../../../components/ha-icon-input";
import "../../../../components/ha-switch";
import { OpenPeerPower } from "../../../../types";
import { EntitiesCardEntityConfig } from "../../cards/types";
import "../../components/hui-action-editor";
import "../../components/hui-entity-editor";
import "../../components/hui-theme-select-editor";
import { LovelaceRowEditor } from "../../types";
import {
  EditorTarget,
  entitiesConfigStruct,
  EntitiesEditorEvent,
} from "../types";
import { configElementStyle } from "./config-elements-style";

const SecondaryInfoValues: { [key: string]: { domains?: string[] } } = {
  "entity-id": {},
  "last-changed": {},
  "last-updated": {},
  "last-triggered": { domains: ["automation", "script"] },
  position: { domains: ["cover"] },
  "tilt-position": { domains: ["cover"] },
  brightness: { domains: ["light"] },
};

@customElement("hui-generic-entity-row-editor")
export class HuiGenericEntityRowEditor
  extends LitElement
  implements LovelaceRowEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntitiesCardEntityConfig;

  public setConfig(config: EntitiesCardEntityConfig): void {
    assert(config, entitiesConfigStruct);
    this._config = config;
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _icon(): string {
    return this._config!.icon || "";
  }

  get _secondary_info(): string {
    return this._config!.secondary_info || "";
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    const domain = computeDomain(this._config.entity);

    return html`
      <div class="card-config">
        <op-entity-picker
          allow-custom-entity
          .opp=${this.opp}
          .value=${this._config.entity}
          .configValue=${"entity"}
          @change=${this._valueChanged}
        ></op-entity-picker>
        <div class="side-by-side">
          <paper-input
            .label=${this.opp!.localize(
              "ui.panel.lovelace.editor.card.generic.name"
            )}
            .value=${this._config.name}
            .configValue=${"name"}
            @value-changed=${this._valueChanged}
          ></paper-input>
          <op-icon-input
            .label=${this.opp!.localize(
              "ui.panel.lovelace.editor.card.generic.icon"
            )}
            .value=${this._config.icon}
            .placeholder=${stateIcon(this.opp!.states[this._config.entity])}
            .configValue=${"icon"}
            @value-changed=${this._valueChanged}
          ></op-icon-input>
        </div>
        <paper-dropdown-menu .label=${"Secondary Info"}>
          <paper-listbox
            slot="dropdown-content"
            attr-for-selected="value"
            .selected=${this._config.secondary_info || "none"}
            .configValue=${"secondary_info"}
            @iron-select=${this._valueChanged}
          >
            <paper-item value=""
              >${this.opp!.localize(
                "ui.panel.lovelace.editor.card.entities.secondary_info_values.none"
              )}</paper-item
            >
            ${Object.keys(SecondaryInfoValues).map((info) => {
              if (
                !("domains" in SecondaryInfoValues[info]) ||
                ("domains" in SecondaryInfoValues[info] &&
                  SecondaryInfoValues[info].domains!.includes(domain))
              ) {
                return html`
                  <paper-item .value=${info}
                    >${this.opp!.localize(
                      `ui.panel.lovelace.editor.card.entities.secondary_info_values.${info}`
                    )}</paper-item
                  >
                `;
              }
              return "";
            })}
          </paper-listbox>
        </paper-dropdown-menu>
      </div>
    `;
  }

  private _valueChanged(ev: EntitiesEditorEvent): void {
    if (!this._config || !this.opp) {
      return;
    }
    const target = ev.target! as EditorTarget;
    const value = target.value || ev.detail?.item?.value;

    if (this[`_${target.configValue}`] === value) {
      return;
    }

    if (target.configValue) {
      if (value === "" || !value) {
        this._config = { ...this._config };
        delete this._config[target.configValue!];
      } else {
        this._config = {
          ...this._config,
          [target.configValue!]: value,
        };
      }
    }

    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles(): CSSResult {
    return configElementStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-generic-entity-row-editor": HuiGenericEntityRowEditor;
  }
}
