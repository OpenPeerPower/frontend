import "@material/mwc-button";
import "@polymer/paper-dialog-scrollable/paper-dialog-scrollable";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../../components/dialog/ha-paper-dialog";
import type { HaPaperDialog } from "../../../../components/dialog/ha-paper-dialog";
import "../../../../components/ha-circular-progress";
import type { LovelaceConfig } from "../../../../data/lovelace";
import { haStyleDialog } from "../../../../resources/styles";
import type { OpenPeerPower } from "../../../../types";
import type { Lovelace } from "../../types";
import "./hui-lovelace-editor";
import { fireEvent } from "../../../../common/dom/fire_event";

@customElement("hui-dialog-edit-lovelace")
export class HuiDialogEditLovelace extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _lovelace?: Lovelace;

  private _config?: LovelaceConfig;

  private _saving: boolean;

  public constructor() {
    super();
    this._saving = false;
  }

  public async showDialog(lovelace: Lovelace): Promise<void> {
    this._lovelace = lovelace;
    if (this._dialog == null) {
      await this.updateComplete;
    }

    const { views, ...lovelaceConfig } = this._lovelace!.config;
    this._config = lovelaceConfig as LovelaceConfig;

    this._dialog.open();
  }

  public closeDialog(): void {
    this._config = undefined;
    this._dialog.close();
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  private get _dialog(): HaPaperDialog {
    return this.shadowRoot!.querySelector("ha-paper-dialog")!;
  }

  protected render(): TemplateResult {
    return html`
      <ha-paper-dialog with-backdrop modal>
        <h2>
          ${this.opp!.localize(
            "ui.panel.lovelace.editor.edit_lovelace.header"
          )}
        </h2>
        <paper-dialog-scrollable>
          ${this.opp!.localize(
            "ui.panel.lovelace.editor.edit_lovelace.explanation"
          )}
          <hui-lovelace-editor
            .opp=${this.opp}
            .config="${this._config}"
            @lovelace-config-changed="${this._ConfigChanged}"
          ></hui-lovelace-editor
        ></paper-dialog-scrollable>
        <div class="paper-dialog-buttons">
          <mwc-button @click=${this.closeDialog}
            >${this.opp!.localize("ui.common.cancel")}</mwc-button
          >
          <mwc-button
            ?disabled="${!this._config || this._saving}"
            @click="${this._save}"
          >
            ${this._saving
              ? html`<ha-circular-progress
                  active
                  size="small"
                  title="Saving"
                ></ha-circular-progress>`
              : ""}
            ${this.opp!.localize("ui.common.save")}</mwc-button
          >
        </div>
      </ha-paper-dialog>
    `;
  }

  private async _save(): Promise<void> {
    if (!this._config) {
      return;
    }
    if (!this._isConfigChanged()) {
      this.closeDialog();
      return;
    }

    this._saving = true;
    const lovelace = this._lovelace!;

    const config: LovelaceConfig = {
      ...lovelace.config,
      ...this._config,
    };

    try {
      await lovelace.saveConfig(config);
      this.closeDialog();
    } catch (err) {
      alert(`Saving failed: ${err.message}`);
    } finally {
      this._saving = false;
    }
  }

  private _ConfigChanged(ev: CustomEvent): void {
    if (ev.detail && ev.detail.config) {
      this._config = ev.detail.config;
    }
  }

  private _isConfigChanged(): boolean {
    const { views, ...lovelaceConfig } = this._lovelace!.config;
    return JSON.stringify(this._config) !== JSON.stringify(lovelaceConfig);
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        @media all and (max-width: 450px), all and (max-height: 500px) {
          /* overrule the ha-style-dialog max-height on small screens */
          ha-paper-dialog {
            max-height: 100%;
            height: 100%;
          }
        }
        @media all and (min-width: 660px) {
          ha-paper-dialog {
            width: 650px;
          }
        }
        ha-paper-dialog {
          max-width: 650px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-dialog-edit-lovelace": HuiDialogEditLovelace;
  }
}
