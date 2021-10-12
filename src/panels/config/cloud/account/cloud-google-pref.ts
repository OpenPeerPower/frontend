import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/buttons/ha-call-api-button";
import "../../../../components/op-card";
import type { HaSwitch } from "../../../../components/op-switch";
import { CloudStatusLoggedIn, updateCloudPref } from "../../../../data/cloud";
import { showAlertDialog } from "../../../../dialogs/generic/show-dialog-box";
import type { OpenPeerPower } from "../../../../types";
import { showSaveSuccessToast } from "../../../../util/toast-saved-success";

export class CloudGooglePref extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public cloudStatus?: CloudStatusLoggedIn;

  protected render(): TemplateResult {
    if (!this.cloudStatus) {
      return html``;
    }

    const { google_enabled, google_report_state, google_secure_devices_pin } =
      this.cloudStatus.prefs;

    return html`
      <op-card
        header=${this.opp.localize(
          "ui.panel.config.cloud.account.google.title"
        )}
      >
        <div class="switch">
          <op-switch
            id="google_enabled"
            .checked="${google_enabled}"
            @change="${this._enableToggleChanged}"
          ></op-switch>
        </div>
        <div class="card-content">
          <p>
            ${this.opp.localize("ui.panel.config.cloud.account.google.info")}
          </p>
          ${!this.cloudStatus.google_registered
            ? html`
                <h3 class="warning">
                  ${this.opp.localize(
                    "ui.panel.config.cloud.account.google.not_configured_title"
                  )}
                </h3>
                <p>
                  ${this.opp.localize(
                    "ui.panel.config.cloud.account.google.not_configured_text"
                  )}
                </p>

                <ul>
                  <li>
                    <a
                      href="https://assistant.google.com/services/a/uid/00000091fd5fb875?hl=en-US"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ${this.opp.localize(
                        "ui.panel.config.cloud.account.google.enable_op_skill"
                      )}
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.nabucasa.com/config/google_assistant/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      ${this.opp.localize(
                        "ui.panel.config.cloud.account.google.config_documentation"
                      )}
                    </a>
                  </li>
                </ul>
              `
            : ""}
          ${google_enabled
            ? html`
                <div class="state-reporting">
                  <h3>
                    ${this.opp.localize(
                      "ui.panel.config.cloud.account.google.enable_state_reporting"
                    )}
                  </h3>
                  <div class="state-reporting-switch">
                    <op-switch
                      .checked=${google_report_state}
                      @change=${this._reportToggleChanged}
                    ></op-switch>
                  </div>
                </div>
                <p>
                  ${this.opp.localize(
                    "ui.panel.config.cloud.account.google.info_state_reporting"
                  )}
                </p>
                <div class="secure_devices">
                  <h3>
                    ${this.opp.localize(
                      "ui.panel.config.cloud.account.google.security_devices"
                    )}
                  </h3>
                  ${this.opp.localize(
                    "ui.panel.config.cloud.account.google.enter_pin_info"
                  )}
                  <paper-input
                    label="${this.opp.localize(
                      "ui.panel.config.cloud.account.google.devices_pin"
                    )}"
                    id="google_secure_devices_pin"
                    placeholder="${this.opp.localize(
                      "ui.panel.config.cloud.account.google.enter_pin_hint"
                    )}"
                    .value=${google_secure_devices_pin || ""}
                    @change="${this._pinChanged}"
                  ></paper-input>
                </div>
              `
            : ""}
        </div>
        <div class="card-actions">
          <op-call-api-button
            .opp=${this.opp}
            .disabled=${!google_enabled}
            @opp-api-called=${this._syncEntitiesCalled}
            path="cloud/google_actions/sync"
          >
            ${this.opp.localize(
              "ui.panel.config.cloud.account.google.sync_entities"
            )}
          </op-call-api-button>
          <a href="/config/cloud/google-assistant">
            <mwc-button>
              ${this.opp.localize(
                "ui.panel.config.cloud.account.google.manage_entities"
              )}
            </mwc-button>
          </a>
        </div>
      </op-card>
    `;
  }

  private async _syncEntitiesCalled(ev: CustomEvent) {
    if (!ev.detail.success && ev.detail.response.status_code === 404) {
      this._syncFailed();
    }
  }

  private async _syncFailed() {
    showAlertDialog(this, {
      title: this.opp.localize(
        "ui.panel.config.cloud.account.google.not_configured_title"
      ),
      text: this.opp.localize(
        "ui.panel.config.cloud.account.google.not_configured_text"
      ),
    });
    fireEvent(this, "ha-refresh-cloud-status");
  }

  private async _enableToggleChanged(ev) {
    const toggle = ev.target as HaSwitch;
    try {
      await updateCloudPref(this.opp, { [toggle.id]: toggle.checked! });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      toggle.checked = !toggle.checked;
    }
  }

  private async _reportToggleChanged(ev) {
    const toggle = ev.target as HaSwitch;
    try {
      await updateCloudPref(this.opp, {
        google_report_state: toggle.checked!,
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      alert(
        `Unable to ${toggle.checked ? "enable" : "disable"} report state. ${
          err.message
        }`
      );
      toggle.checked = !toggle.checked;
    }
  }

  private async _pinChanged(ev) {
    const input = ev.target as PaperInputElement;
    try {
      await updateCloudPref(this.opp, {
        [input.id]: input.value || null,
      });
      showSaveSuccessToast(this, this.opp);
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      alert(
        `${this.opp.localize(
          "ui.panel.config.cloud.account.google.enter_pin_error"
        )} ${err.message}`
      );
      input.value = this.cloudStatus!.prefs.google_secure_devices_pin;
    }
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
      .switch {
        position: absolute;
        right: 24px;
        top: 24px;
      }
      :host([dir="rtl"]) .switch {
        right: auto;
        left: 24px;
      }
      ha-call-api-button {
        color: var(--primary-color);
        font-weight: 500;
      }
      paper-input {
        width: 250px;
      }
      .card-actions {
        display: flex;
        justify-content: space-between;
      }
      .card-actions a {
        text-decoration: none;
      }
      .warning {
        color: var(--error-color);
      }
      .secure_devices {
        padding-top: 8px;
      }
      .state-reporting {
        display: flex;
        margin-top: 1.5em;
      }
      .state-reporting + p {
        margin-top: 0.5em;
      }
      h3 {
        margin: 0 0 8px 0;
      }
      .state-reporting h3 {
        flex-grow: 1;
        margin: 0;
      }
      .state-reporting-switch {
        margin-top: 0.25em;
        margin-right: 7px;
        margin-left: 0.5em;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cloud-google-pref": CloudGooglePref;
  }
}

customElements.define("cloud-google-pref", CloudGooglePref);
