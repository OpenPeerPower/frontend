import { mdiMicrophone } from "@mdi/js";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import "../../components/ha-menu-button";
import { showVoiceCommandDialog } from "../../dialogs/voice-command-dialog/show-op-voice-command-dialog";
import "../../layouts/op-app-layout";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";
import { HuiErrorCard } from "../lovelace/cards/hui-error-card";
import { createCardElement } from "../lovelace/create-element/create-card-element";
import { LovelaceCard } from "../lovelace/types";

@customElement("op-panel-shopping-list")
class PanelShoppingList extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @internalProperty() private _card!: LovelaceCard | HuiErrorCard;

  private _conversation = memoizeOne((_components) =>
    isComponentLoaded(this.opp, "conversation")
  );

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    this._card = createCardElement({ type: "shopping-list" }) as LovelaceCard;
    this._card.opp = this.opp;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has("opp")) {
      this._card.opp = this.opp;
    }
  }

  protected render(): TemplateResult {
    return html`
      <op-app-layout>
        <app-header fixed slot="header">
          <app-toolbar>
            <op-menu-button
              .opp=${this.opp}
              .narrow=${this.narrow}
            ></op-menu-button>
            <div main-title>${this.opp.localize("panel.shopping_list")}</div>
            ${this._conversation(this.opp.config.components)
              ? html`
                  <mwc-icon-button
                    .label=${this.opp!.localize(
                      "ui.panel.shopping_list.start_conversation"
                    )}
                    @click=${this._showVoiceCommandDialog}
                  >
                    <op-svg-icon .path=${mdiMicrophone}></op-svg-icon>
                  </mwc-icon-button>
                `
              : ""}
          </app-toolbar>
        </app-header>
        <div id="columns">
          <div class="column">${this._card}</div>
        </div>
      </op-app-layout>
    `;
  }

  private _showVoiceCommandDialog(): void {
    showVoiceCommandDialog(this);
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        :host {
          --mdc-theme-primary: var(--app-header-text-color);
          display: block;
          height: 100%;
        }
        :host([narrow]) app-toolbar mwc-button {
          width: 65px;
        }
        .heading {
          overflow: hidden;
          white-space: nowrap;
          margin-top: 4px;
        }
        #columns {
          display: flex;
          flex-direction: row;
          justify-content: center;
          margin-left: 4px;
          margin-right: 4px;
        }
        .column {
          flex: 1 0 0;
          max-width: 500px;
          min-width: 0;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-panel-shopping-list": PanelShoppingList;
  }
}
