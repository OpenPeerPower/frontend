import "@polymer/paper-dialog-scrollable/paper-dialog-scrollable";
import deepFreeze from "deep-freeze";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  query,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/dialog/op-paper-dialog";
import type { HaPaperDialog } from "../../../../components/dialog/op-paper-dialog";
import type { LovelaceCardConfig } from "../../../../data/lovelace";
import { haStyleDialog } from "../../../../resources/styles";
import type { OpenPeerPower } from "../../../../types";
import "./hui-card-preview";
import type { DeleteCardDialogParams } from "./show-delete-card-dialog";

@customElement("hui-dialog-delete-card")
export class HuiDialogDeleteCard extends LitElement {
  @property() protected opp!: OpenPeerPower;

  @internalProperty() private _params?: DeleteCardDialogParams;

  @internalProperty() private _cardConfig?: LovelaceCardConfig;

  @query("op-paper-dialog", true) private _dialog!: HaPaperDialog;

  public async showDialog(params: DeleteCardDialogParams): Promise<void> {
    this._params = params;
    this._cardConfig = params.cardConfig;
    if (!Object.isFrozen(this._cardConfig)) {
      this._cardConfig = deepFreeze(this._cardConfig);
    }
    await this.updateComplete;
    fireEvent(this._dialog as HTMLElement, "iron-resize");
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }

    return html`
      <op-paper-dialog with-backdrop opened modal>
        <h2>${this.opp.localize("ui.panel.lovelace.cards.confirm_delete")}</h2>
        <paper-dialog-scrollable>
          ${this._cardConfig
            ? html`
                <div class="element-preview">
                  <hui-card-preview
                    .opp=${this.opp}
                    .config="${this._cardConfig}"
                  ></hui-card-preview>
                </div>
              `
            : ""}
        </paper-dialog-scrollable>
        <div class="paper-dialog-buttons">
          <mwc-button @click="${this._close}">
            ${this.opp!.localize("ui.common.cancel")}
          </mwc-button>
          <mwc-button class="warning" @click="${this._delete}">
            ${this.opp!.localize("ui.common.delete")}
          </mwc-button>
        </div>
      </op-paper-dialog>
    `;
  }

  static get styles(): CSSResultArray {
    return [
      haStyleDialog,
      css`
        .element-preview {
          position: relative;
        }
        hui-card-preview {
          margin: 4px auto;
          max-width: 500px;
          display: block;
          width: 100%;
        }
      `,
    ];
  }

  private _close(): void {
    this._params = undefined;
    this._cardConfig = undefined;
  }

  private _delete(): void {
    if (!this._params?.deleteCard) {
      return;
    }
    this._params.deleteCard();
    this._close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-dialog-delete-card": HuiDialogDeleteCard;
  }
}
