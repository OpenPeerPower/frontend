import "@material/mwc-button";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../../common/dom/fire_event";
import "../../../../components/op-card";
import "../../../../components/op-switch";
import type { HaSwitch } from "../../../../components/op-switch";
import { syncCloudAlexaEntities } from "../../../../data/alexa";
import { CloudStatusLoggedIn, updateCloudPref } from "../../../../data/cloud";
import type { OpenPeerPower } from "../../../../types";

export class CloudAlexaPref extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public cloudStatus?: CloudStatusLoggedIn;

  @internalProperty() private _syncing = false;

  protected render(): TemplateResult {
    if (!this.cloudStatus) {
      return html``;
    }

    const { alexa_enabled, alexa_report_state } = this.cloudStatus!.prefs;

    return html`
      <op-card
        header=${this.opp!.localize(
          "ui.panel.config.cloud.account.alexa.title"
        )}
      >
        <div class="switch">
          <op-switch
            .checked=${alexa_enabled}
            @change=${this._enabledToggleChanged}
          ></op-switch>
        </div>
        <div class="card-content">
          ${this.opp!.localize("ui.panel.config.cloud.account.alexa.info")}
          <ul>
            <li>
              <a
                href="https://skills-store.amazon.com/deeplink/dp/B0772J1QKB?deviceType=app"
                target="_blank"
                rel="noreferrer"
              >
                ${this.opp!.localize(
                  "ui.panel.config.cloud.account.alexa.enable_op_skill"
                )}
              </a>
            </li>
            <li>
              <a
                href="https://www.nabucasa.com/config/amazon_alexa/"
                target="_blank"
                rel="noreferrer"
              >
                ${this.opp!.localize(
                  "ui.panel.config.cloud.account.alexa.config_documentation"
                )}
              </a>
            </li>
          </ul>
          ${alexa_enabled
            ? html`
                <div class="state-reporting">
                  <h3>
                    ${this.opp!.localize(
                      "ui.panel.config.cloud.account.alexa.enable_state_reporting"
                    )}
                  </h3>
                  <div class="state-reporting-switch">
                    <op-switch
                      .checked=${alexa_report_state}
                      @change=${this._reportToggleChanged}
                    ></op-switch>
                  </div>
                </div>
                <p>
                  ${this.opp!.localize(
                    "ui.panel.config.cloud.account.alexa.info_state_reporting"
                  )}
                </p>
              `
            : ""}
        </div>
        <div class="card-actions">
          <mwc-button
            @click=${this._handleSync}
            .disabled=${!alexa_enabled || this._syncing}
          >
            ${this.opp!.localize(
              "ui.panel.config.cloud.account.alexa.sync_entities"
            )}
          </mwc-button>
          <div class="spacer"></div>
          <a href="/config/cloud/alexa">
            <mwc-button
              >${this.opp!.localize(
                "ui.panel.config.cloud.account.alexa.manage_entities"
              )}</mwc-button
            >
          </a>
        </div>
      </op-card>
    `;
  }

  private async _handleSync() {
    this._syncing = true;
    try {
      await syncCloudAlexaEntities(this.opp!);
    } catch (err) {
      alert(
        `${this.opp!.localize(
          "ui.panel.config.cloud.account.alexa.sync_entities_error"
        )} ${err.body.message}`
      );
    } finally {
      this._syncing = false;
    }
  }

  private async _enabledToggleChanged(ev) {
    const toggle = ev.target as HaSwitch;
    try {
      await updateCloudPref(this.opp!, { alexa_enabled: toggle.checked! });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      toggle.checked = !toggle.checked;
    }
  }

  private async _reportToggleChanged(ev) {
    const toggle = ev.target as HaSwitch;
    try {
      await updateCloudPref(this.opp!, {
        alexa_report_state: toggle.checked!,
      });
      fireEvent(this, "ha-refresh-cloud-status");
    } catch (err) {
      alert(
        `${this.opp!.localize(
          "ui.panel.config.cloud.account.alexa.state_reporting_error",
          "enable_disable",
          this.opp!.localize(
            toggle.checked
              ? "ui.panel.config.cloud.account.alexa.enable"
              : "ui.panel.config.cloud.account.alexa.disable"
          )
        )} ${err.message}`
      );
      toggle.checked = !toggle.checked;
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
      .card-actions {
        display: flex;
      }
      .card-actions a {
        text-decoration: none;
      }
      .spacer {
        flex-grow: 1;
      }
      .state-reporting {
        display: flex;
        margin-top: 1.5em;
      }
      .state-reporting + p {
        margin-top: 0.5em;
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
    "cloud-alexa-pref": CloudAlexaPref;
  }
}

customElements.define("cloud-alexa-pref", CloudAlexaPref);
