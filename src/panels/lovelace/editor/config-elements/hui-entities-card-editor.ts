import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-input/paper-input";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import {
  array,
  assert,
  boolean,
  object,
  optional,
  string,
  union,
} from "superstruct";
import { fireEvent, OPPDomEvent } from "../../../../common/dom/fire_event";
import { computeRTLDirection } from "../../../../common/util/compute_rtl";
import "../../../../components/entity/state-badge";
import "../../../../components/ha-card";
import "../../../../components/ha-formfield";
import "../../../../components/op-icon";
import "../../../../components/ha-switch";
import type { OpenPeerPower } from "../../../../types";
import type { EntitiesCardConfig } from "../../cards/types";
import "../../components/hui-theme-select-editor";
import type { LovelaceRowConfig } from "../../entity-rows/types";
import { headerFooterConfigStructs } from "../../header-footer/types";
import type { LovelaceCardEditor } from "../../types";
import "../header-footer-editor/hui-header-footer-editor";
import "../hui-entities-card-row-editor";
import "../hui-sub-element-editor";
import { processEditorEntities } from "../process-editor-entities";
import {
  EditorTarget,
  EditSubElementEvent,
  entitiesConfigStruct,
  SubElementEditorConfig,
} from "../types";
import { configElementStyle } from "./config-elements-style";

const cardConfigStruct = object({
  type: string(),
  title: optional(union([string(), boolean()])),
  theme: optional(string()),
  show_header_toggle: optional(boolean()),
  state_color: optional(boolean()),
  entities: array(entitiesConfigStruct),
  header: optional(headerFooterConfigStructs),
  footer: optional(headerFooterConfigStructs),
});

@customElement("hui-entities-card-editor")
export class HuiEntitiesCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntitiesCardConfig;

  @internalProperty() private _configEntities?: LovelaceRowConfig[];

  @internalProperty() private _subElementEditorConfig?: SubElementEditorConfig;

  public setConfig(config: EntitiesCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
    this._configEntities = processEditorEntities(config.entities);
  }

  get _title(): string {
    return this._config!.title || "";
  }

  get _theme(): string {
    return this._config!.theme || "";
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    if (this._subElementEditorConfig) {
      return html`
        <hui-sub-element-editor
          .opp=${this.opp}
          .config=${this._subElementEditorConfig}
          @go-back=${this._goBack}
          @config-changed=${this._handleSubElementChanged}
        >
        </hui-sub-element-editor>
      `;
    }

    return html`
      <div class="card-config">
        <paper-input
          .label="${this.opp.localize(
            "ui.panel.lovelace.editor.card.generic.title"
          )} (${this.opp.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value=${this._title}
          .configValue=${"title"}
          @value-changed=${this._valueChanged}
        ></paper-input>
        <hui-theme-select-editor
          .opp=${this.opp}
          .value=${this._theme}
          .configValue=${"theme"}
          @value-changed=${this._valueChanged}
        ></hui-theme-select-editor>
        <div class="side-by-side">
          <op-formfield
            .label=${this.opp.localize(
              "ui.panel.lovelace.editor.card.entities.show_header_toggle"
            )}
            .dir=${computeRTLDirection(this.opp)}
          >
            <op-switch
              .checked=${this._config!.show_header_toggle !== false}
              .configValue=${"show_header_toggle"}
              @change=${this._valueChanged}
            ></op-switch>
          </op-formfield>
          <op-formfield
            .label=${this.opp.localize(
              "ui.panel.lovelace.editor.card.generic.state_color"
            )}
            .dir=${computeRTLDirection(this.opp)}
          >
            <op-switch
              .checked=${this._config!.state_color}
              .configValue=${"state_color"}
              @change=${this._valueChanged}
            ></op-switch>
          </op-formfield>
        </div>
        <hui-header-footer-editor
          .opp=${this.opp}
          .configValue=${"header"}
          .config=${this._config.header}
          @value-changed=${this._valueChanged}
          @edit-detail-element=${this._editDetailElement}
        ></hui-header-footer-editor>
        <hui-header-footer-editor
          .opp=${this.opp}
          .configValue=${"footer"}
          .config=${this._config.footer}
          @value-changed=${this._valueChanged}
          @edit-detail-element=${this._editDetailElement}
        ></hui-header-footer-editor>
      </div>
      <hui-entities-card-row-editor
        .opp=${this.opp}
        .entities=${this._configEntities}
        @entities-changed=${this._valueChanged}
        @edit-detail-element=${this._editDetailElement}
      ></hui-entities-card-row-editor>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config || !this.opp) {
      return;
    }

    const target = ev.target! as EditorTarget;
    const configValue =
      target.configValue || this._subElementEditorConfig?.type;
    const value =
      target.checked !== undefined
        ? target.checked
        : target.value || ev.detail.config || ev.detail.value;

    if (
      (configValue! === "title" && target.value === this._title) ||
      (configValue! === "theme" && target.value === this._theme)
    ) {
      return;
    }

    if (configValue === "row" || (ev.detail && ev.detail.entities)) {
      const newConfigEntities =
        ev.detail.entities || this._configEntities!.concat();
      if (configValue === "row") {
        if (!value) {
          newConfigEntities.splice(this._subElementEditorConfig!.index!, 1);
          this._goBack();
        } else {
          newConfigEntities[this._subElementEditorConfig!.index!] = value;
        }

        this._subElementEditorConfig!.elementConfig = value;
      }

      this._config = { ...this._config!, entities: newConfigEntities };
      this._configEntities = processEditorEntities(this._config!.entities);
    } else if (configValue) {
      if (value === "") {
        this._config = { ...this._config };
        delete this._config[configValue!];
      } else {
        this._config = {
          ...this._config,
          [configValue]: value,
        };
      }
    }

    fireEvent(this, "config-changed", { config: this._config });
  }

  private _handleSubElementChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config || !this.opp) {
      return;
    }

    const configValue = this._subElementEditorConfig?.type;
    const value = ev.detail.config;

    if (configValue === "row") {
      const newConfigEntities = this._configEntities!.concat();
      if (!value) {
        newConfigEntities.splice(this._subElementEditorConfig!.index!, 1);
        this._goBack();
      } else {
        newConfigEntities[this._subElementEditorConfig!.index!] = value;
      }

      this._config = { ...this._config!, entities: newConfigEntities };
      this._configEntities = processEditorEntities(this._config!.entities);
    } else if (configValue) {
      if (value === "") {
        this._config = { ...this._config };
        delete this._config[configValue!];
      } else {
        this._config = {
          ...this._config,
          [configValue]: value,
        };
      }
    }

    this._subElementEditorConfig = {
      ...this._subElementEditorConfig!,
      elementConfig: value,
    };

    fireEvent(this, "config-changed", { config: this._config });
  }

  private _editDetailElement(ev: OPPDomEvent<EditSubElementEvent>): void {
    this._subElementEditorConfig = ev.detail.subElementConfig;
  }

  private _goBack(): void {
    this._subElementEditorConfig = undefined;
  }

  static get styles(): CSSResultArray {
    return [
      configElementStyle,
      css`
        .edit-entity-row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
        }

        hui-header-footer-editor {
          padding-top: 4px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-entities-card-editor": HuiEntitiesCardEditor;
  }
}
