import "@material/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
} from "lit-element";
import { formatDateTime } from "../../../../common/datetime/format_date_time";
import "../../../../components/dialog/op-paper-dialog";
import type { HaPaperDialog } from "../../../../components/dialog/op-paper-dialog";
import { haStyle } from "../../../../resources/styles";
import type { OpenPeerPower } from "../../../../types";
import type { CloudCertificateParams as CloudCertificateDialogParams } from "./show-dialog-cloud-certificate";

@customElement("dialog-cloud-certificate")
class DialogCloudCertificate extends LitElement {
  public opp!: OpenPeerPower;

  @property()
  private _params?: CloudCertificateDialogParams;

  public async showDialog(params: CloudCertificateDialogParams) {
    this._params = params;
    // Wait till dialog is rendered.
    await this.updateComplete;
    this._dialog.open();
  }

  protected render() {
    if (!this._params) {
      return html``;
    }
    const { certificateInfo } = this._params;

    return html`
      <op-paper-dialog with-backdrop>
        <h2>
          ${this.opp!.localize(
            "ui.panel.config.cloud.dialog_certificate.certificate_information"
          )}
        </h2>
        <div>
          <p>
            ${this.opp!.localize(
              "ui.panel.config.cloud.dialog_certificate.certificate_expiration_date"
            )}
            ${formatDateTime(
              new Date(certificateInfo.expire_date),
              this.opp!.locale
            )}<br />
            (${this.opp!.localize(
              "ui.panel.config.cloud.dialog_certificate.will_be_auto_renewed"
            )})
          </p>
          <p class="break-word">
            ${this.opp!.localize(
              "ui.panel.config.cloud.dialog_certificate.fingerprint"
            )}
            ${certificateInfo.fingerprint}
          </p>
        </div>

        <div class="paper-dialog-buttons">
          <mwc-button @click="${this._closeDialog}"
            >${this.opp!.localize(
              "ui.panel.config.cloud.dialog_certificate.close"
            )}</mwc-button
          >
        </div>
      </op-paper-dialog>
    `;
  }

  private get _dialog(): HaPaperDialog {
    return this.shadowRoot!.querySelector("op-paper-dialog")!;
  }

  private _closeDialog() {
    this._dialog.close();
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        op-paper-dialog {
          width: 535px;
        }
        .break-word {
          overflow-wrap: break-word;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-cloud-certificate": DialogCloudCertificate;
  }
}
