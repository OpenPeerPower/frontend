import "../../../components/ha-markdown";
import "@material/mwc-button";
import "@polymer/paper-dialog-scrollable/paper-dialog-scrollable";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  query,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/ha-circular-progress";
import "../../../components/ha-expansion-panel";
import {
  BlueprintImportResult,
  importBlueprint,
  saveBlueprint,
} from "../../../data/blueprint";
import { haStyleDialog } from "../../../resources/styles";
import type { OpenPeerPower } from "../../../types";
import { createCloseHeading } from "../../../components/ha-dialog";

@customElement("ha-dialog-import-blueprint")
class DialogImportBlueprint extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _params?;

  @internalProperty() private _importing = false;

  @internalProperty() private _saving = false;

  @internalProperty() private _error?: string;

  @internalProperty() private _result?: BlueprintImportResult;

  @internalProperty() private _url?: string;

  @query("#input") private _input?: PaperInputElement;

  public showDialog(params): void {
    this._params = params;
    this._error = undefined;
    this._url = this._params.url;
  }

  public closeDialog(): void {
    this._error = undefined;
    this._result = undefined;
    this._params = undefined;
    this._url = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        .heading=${createCloseHeading(
          this.opp,
          this.opp.localize("ui.panel.config.blueprint.add.header")
        )}
      >
        <div>
          ${this._error ? html` <div class="error">${this._error}</div> ` : ""}
          ${this._result
            ? html`${this.opp.localize(
                  "ui.panel.config.blueprint.add.import_header",
                  "name",
                  html`<b>${this._result.blueprint.metadata.name}</b>`,
                  "domain",
                  this._result.blueprint.metadata.domain
                )}
                <br />
                <op-markdown
                  breaks
                  .content=${this._result.blueprint.metadata.description}
                ></op-markdown>
                ${this._result.validation_errors
                  ? html`
                      <p class="error">
                        ${this.opp.localize(
                          "ui.panel.config.blueprint.add.unsupported_blueprint"
                        )}
                      </p>
                      <ul class="error">
                        ${this._result.validation_errors.map(
                          (error) => html`<li>${error}</li>`
                        )}
                      </ul>
                    `
                  : html`
                      <paper-input
                        id="input"
                        .value=${this._result.suggested_filename}
                        .label=${this.opp.localize(
                          "ui.panel.config.blueprint.add.file_name"
                        )}
                      ></paper-input>
                    `}
                <op-expansion-panel
                  .header=${this.opp.localize(
                    "ui.panel.config.blueprint.add.raw_blueprint"
                  )}
                >
                  <pre>${this._result.raw_data}</pre>
                </op-expansion-panel>`
            : html`${this.opp.localize(
                  "ui.panel.config.blueprint.add.import_introduction_link",
                  "community_link",
                  html`<a
                    href="https://www.openpeerpower.io/get-blueprints"
                    target="_blank"
                    rel="noreferrer noopener"
                    >${this.opp.localize(
                      "ui.panel.config.blueprint.add.community_forums"
                    )}</a
                  >`
                )}<paper-input
                  id="input"
                  .label=${this.opp.localize(
                    "ui.panel.config.blueprint.add.url"
                  )}
                  .value=${this._url}
                  dialogInitialFocus
                ></paper-input>`}
        </div>
        ${!this._result
          ? html`<mwc-button
              slot="primaryAction"
              @click=${this._import}
              .disabled=${this._importing}
            >
              ${this._importing
                ? html`<op-circular-progress
                    active
                    size="small"
                    .title=${this.opp.localize(
                      "ui.panel.config.blueprint.add.importing"
                    )}
                  ></op-circular-progress>`
                : ""}
              ${this.opp.localize("ui.panel.config.blueprint.add.import_btn")}
            </mwc-button>`
          : html`<mwc-button
                slot="secondaryAction"
                @click=${this.closeDialog}
                .disabled=${this._saving}
              >
                ${this.opp.localize("ui.common.cancel")}
              </mwc-button>
              <mwc-button
                slot="primaryAction"
                @click=${this._save}
                .disabled=${this._saving || this._result.validation_errors}
              >
                ${this._saving
                  ? html`<op-circular-progress
                      active
                      size="small"
                      .title=${this.opp.localize(
                        "ui.panel.config.blueprint.add.saving"
                      )}
                    ></op-circular-progress>`
                  : ""}
                ${this.opp.localize("ui.panel.config.blueprint.add.save_btn")}
              </mwc-button>`}
      </op-dialog>
    `;
  }

  private async _import() {
    this._url = undefined;
    this._importing = true;
    this._error = undefined;
    try {
      const url = this._input?.value;
      if (!url) {
        this._error = this.opp.localize(
          "ui.panel.config.blueprint.add.error_no_url"
        );
        return;
      }
      this._result = await importBlueprint(this.opp, url);
    } catch (e) {
      this._error = e.message;
    } finally {
      this._importing = false;
    }
  }

  private async _save() {
    this._saving = true;
    try {
      const filename = this._input?.value;
      if (!filename) {
        return;
      }
      await saveBlueprint(
        this.opp,
        this._result!.blueprint.metadata.domain,
        filename,
        this._result!.raw_data,
        this._result!.blueprint.metadata.source_url
      );
      this._params.importedCallback();
      this.closeDialog();
    } catch (e) {
      this._error = e.message;
    } finally {
      this._saving = false;
    }
  }

  static get styles(): CSSResult {
    return haStyleDialog;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-dialog-import-blueprint": DialogImportBlueprint;
  }
}
