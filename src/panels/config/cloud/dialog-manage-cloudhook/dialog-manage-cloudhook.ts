import "@material/mwc-button";
import "@polymer/paper-dialog-scrollable/paper-dialog-scrollable";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
} from "lit-element";
import "../../../../components/dialog/op-paper-dialog";
import type { HaPaperDialog } from "../../../../components/dialog/op-paper-dialog";
import { showConfirmationDialog } from "../../../../dialogs/generic/show-dialog-box";
import { haStyle } from "../../../../resources/styles";
import { OpenPeerPower } from "../../../../types";
import { documentationUrl } from "../../../../util/documentation-url";
import { WebhookDialogParams } from "./show-dialog-manage-cloudhook";

const inputLabel = "Public URL – Click to copy to clipboard";

export class DialogManageCloudhook extends LitElement {
  protected opp?: OpenPeerPower;

  @internalProperty() private _params?: WebhookDialogParams;

  public async showDialog(params: WebhookDialogParams) {
    this._params = params;
    // Wait till dialog is rendered.
    await this.updateComplete;
    this._dialog.open();
  }

  protected render() {
    if (!this._params) {
      return html``;
    }
    const { webhook, cloudhook } = this._params;
    const docsUrl =
      webhook.domain === "automation"
        ? documentationUrl(
            this.opp!,
            "/docs/automation/trigger/#webhook-trigger"
          )
        : documentationUrl(this.opp!, `/integrations/${webhook.domain}/`);
    return html`
      <op-paper-dialog with-backdrop>
        <h2>
          ${this.opp!.localize(
            "ui.panel.config.cloud.dialog_cloudhook.webhook_for",
            "name",
            webhook.name
          )}
        </h2>
        <div>
          <p>
            ${this.opp!.localize(
              "ui.panel.config.cloud.dialog_cloudhook.available_at"
            )}
          </p>
          <paper-input
            label="${inputLabel}"
            value="${cloudhook.cloudhook_url}"
            @click="${this._copyClipboard}"
            @blur="${this._restoreLabel}"
          ></paper-input>
          <p>
            ${cloudhook.managed
              ? html`
                  ${this.opp!.localize(
                    "ui.panel.config.cloud.dialog_cloudhook.managed_by_integration"
                  )}
                `
              : html`
                  ${this.opp!.localize(
                    "ui.panel.config.cloud.dialog_cloudhook.info_disable_webhook"
                  )}
                  <button class="link" @click="${this._disableWebhook}">
                    ${this.opp!.localize(
                      "ui.panel.config.cloud.dialog_cloudhook.link_disable_webhook"
                    )}</button
                  >.
                `}
          </p>
        </div>

        <div class="paper-dialog-buttons">
          <a href="${docsUrl}" target="_blank" rel="noreferrer">
            <mwc-button
              >${this.opp!.localize(
                "ui.panel.config.cloud.dialog_cloudhook.view_documentation"
              )}</mwc-button
            >
          </a>
          <mwc-button @click="${this._closeDialog}"
            >${this.opp!.localize(
              "ui.panel.config.cloud.dialog_cloudhook.close"
            )}</mwc-button
          >
        </div>
      </op-paper-dialog>
    `;
  }

  private get _dialog(): HaPaperDialog {
    return this.shadowRoot!.querySelector("op-paper-dialog")!;
  }

  private get _paperInput(): PaperInputElement {
    return this.shadowRoot!.querySelector("paper-input")!;
  }

  private _closeDialog() {
    this._dialog.close();
  }

  private async _disableWebhook() {
    showConfirmationDialog(this, {
      text: this.opp!.localize(
        "ui.panel.config.cloud.dialog_cloudhook.confirm_disable"
      ),
      dismissText: this.opp!.localize("ui.common.cancel"),
      confirmText: this.opp!.localize("ui.common.disable"),
      confirm: () => {
        this._params!.disableHook();
        this._closeDialog();
      },
    });
  }

  private _copyClipboard(ev: FocusEvent) {
    // paper-input -> iron-input -> input
    const paperInput = ev.currentTarget as PaperInputElement;
    const input = (paperInput.inputElement as any)
      .inputElement as HTMLInputElement;
    input.setSelectionRange(0, input.value.length);
    try {
      document.execCommand("copy");
      paperInput.label = this.opp!.localize(
        "ui.panel.config.cloud.dialog_cloudhook.copied_to_clipboard"
      );
    } catch (err) {
      // Copying failed. Oh no
    }
  }

  private _restoreLabel() {
    this._paperInput.label = inputLabel;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        op-paper-dialog {
          width: 650px;
        }
        paper-input {
          margin-top: -8px;
        }
        button.link {
          color: var(--primary-color);
        }
        .paper-dialog-buttons a {
          text-decoration: none;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-manage-cloudhook": DialogManageCloudhook;
  }
}

customElements.define("dialog-manage-cloudhook", DialogManageCloudhook);
