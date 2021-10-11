import "@material/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import "../../components/buttons/ha-progress-button";
import "../../components/entity/op-entity-picker";
import "../../components/ha-card";
import "../../components/ha-circular-progress";
import { haStyle } from "../../resources/styles";
import "../../styles/polymer-op-style";
import type { OpenPeerPower } from "../../types";
import { HaFormCustomize } from "./customize/ha-form-customize";

@customElement("op-entity-config")
export class HaEntityConfig extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public selectedEntityId!: string;

  // False if no entity is selected or currently saving or loading
  @property() private _formEditState = false;

  @query("#form") private _form!: HaFormCustomize;

  protected render(): TemplateResult {
    return html`
      <op-card>
        <div class="card-content">
          <op-entity-picker
            .opp=${this.opp}
            .value=${this.selectedEntityId}
            .configValue=${"entity"}
            @change=${this._selectedEntityChanged}
            allow-custom-entity
            hideClearIcon
          >
          </op-entity-picker>

          <div class="form-container">
            <op-form-customize .opp=${this.opp} .id=${"form"}>
            </op-form-customize>
          </div>
        </div>
        <div class="card-actions">
          <op-progress-button
            @click=${this._saveEntity}
            .disabled=${!this._formEditState}
          >
            ${this.opp.localize("ui.common.save")}
          </op-progress-button>
        </div>
      </op-card>
    `;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (
      changedProps.has("selectedEntityId") &&
      changedProps.get("selectedEntityId") !== this.selectedEntityId
    ) {
      this._selectEntity(this.selectedEntityId);
      this.requestUpdate();
    }
  }

  private _selectedEntityChanged(ev) {
    this._selectEntity(ev.target.value);
  }

  private async _selectEntity(entityId?: string) {
    if (!this._form || !entityId) return;
    const entity = this.opp.states[entityId];
    if (!entity) return;

    this._formEditState = false;
    await this._form.loadEntity(entity);
    this._formEditState = true;
  }

  private async _saveEntity(ev) {
    if (!this._formEditState) return;
    this._formEditState = false;
    const button = ev.target;
    button.progress = true;

    try {
      await this._form.saveEntity();
      this._formEditState = true;
      button.actionSuccess();
    } catch {
      button.actionError();
    } finally {
      button.progress = false;
    }
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        ha-card {
          direction: ltr;
        }

        .form-placeholder {
          height: 96px;
        }

        .hidden {
          display: none;
        }
      `,
    ];
  }
}
