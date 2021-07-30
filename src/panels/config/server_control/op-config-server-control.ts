import "@material/mwc-button";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-input/paper-input";
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
import { componentsWithService } from "../../../common/config/components_with_service";
import "../../../components/buttons/ha-call-service-button";
import "../../../components/ha-card";
import { checkCoreConfig } from "../../../data/core";
import { domainToName } from "../../../data/integration";
import "../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import "../ha-config-section";
import { configSections } from "../ha-panel-config";

@customElement("ha-config-server-control")
export class HaConfigServerControl extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property() public showAdvanced!: boolean;

  @internalProperty() private _validating = false;

  @internalProperty() private _reloadableDomains: string[] = [];

  private _validateLog = "";

  private _isValid: boolean | null = null;

  protected updated(changedProperties) {
    const oldOpp = changedProperties.get("opp");
    if (
      changedProperties.has("opp") &&
      (!oldOpp || oldOpp.config.components !== this.opp.config.components)
    ) {
      this._reloadableDomains = componentsWithService(
        this.opp,
        "reload"
      ).sort();
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        back-path="/config"
        .tabs=${configSections.general}
        .showAdvanced=${this.showAdvanced}
      >
        <op-config-section .isWide=${this.isWide}>
          <span slot="header"
            >${this.opp.localize(
              "ui.panel.config.server_control.caption"
            )}</span
          >
          <span slot="introduction"
            >${this.opp.localize(
              "ui.panel.config.server_control.description"
            )}</span
          >

          ${this.showAdvanced
            ? html` <op-card
                header=${this.opp.localize(
                  "ui.panel.config.server_control.section.validation.heading"
                )}
              >
                <div class="card-content">
                  ${this.opp.localize(
                    "ui.panel.config.server_control.section.validation.introduction"
                  )}
                  ${!this._validateLog
                    ? html`
                        <div
                          class="validate-container layout vertical center-center"
                        >
                          ${!this._validating
                            ? html`
                                ${this._isValid
                                  ? html` <div
                                      class="validate-result"
                                      id="result"
                                    >
                                      ${this.opp.localize(
                                        "ui.panel.config.server_control.section.validation.valid"
                                      )}
                                    </div>`
                                  : ""}
                                <mwc-button
                                  raised
                                  @click=${this._validateConfig}
                                >
                                  ${this.opp.localize(
                                    "ui.panel.config.server_control.section.validation.check_config"
                                  )}
                                </mwc-button>
                              `
                            : html`
                                <op-circular-progress
                                  active
                                ></op-circular-progress>
                              `}
                        </div>
                      `
                    : html`
                        <div class="config-invalid">
                          <span class="text">
                            ${this.opp.localize(
                              "ui.panel.config.server_control.section.validation.invalid"
                            )}
                          </span>
                          <mwc-button raised @click=${this._validateConfig}>
                            ${this.opp.localize(
                              "ui.panel.config.server_control.section.validation.check_config"
                            )}
                          </mwc-button>
                        </div>
                        <div id="configLog" class="validate-log">
                          ${this._validateLog}
                        </div>
                      `}
                </div>
              </op-card>`
            : ""}

          <op-card
            header=${this.opp.localize(
              "ui.panel.config.server_control.section.server_management.heading"
            )}
          >
            <div class="card-content">
              ${this.opp.localize(
                "ui.panel.config.server_control.section.server_management.introduction"
              )}
            </div>
            <div class="card-actions warning">
              <op-call-service-button
                class="warning"
                .opp=${this.opp}
                domain="openpeerpower"
                service="restart"
                .confirmation=${this.opp.localize(
                  "ui.panel.config.server_control.section.server_management.confirm_restart"
                )}
                >${this.opp.localize(
                  "ui.panel.config.server_control.section.server_management.restart"
                )}
              </op-call-service-button>
              <op-call-service-button
                class="warning"
                .opp=${this.opp}
                domain="openpeerpower"
                service="stop"
                confirmation=${this.opp.localize(
                  "ui.panel.config.server_control.section.server_management.confirm_stop"
                )}
                >${this.opp.localize(
                  "ui.panel.config.server_control.section.server_management.stop"
                )}
              </op-call-service-button>
            </div>
          </op-card>

          ${this.showAdvanced
            ? html`
                <op-card
                  header=${this.opp.localize(
                    "ui.panel.config.server_control.section.reloading.heading"
                  )}
                >
                  <div class="card-content">
                    ${this.opp.localize(
                      "ui.panel.config.server_control.section.reloading.introduction"
                    )}
                  </div>
                  <div class="card-actions">
                    <op-call-service-button
                      .opp=${this.opp}
                      domain="openpeerpower"
                      service="reload_core_config"
                      >${this.opp.localize(
                        "ui.panel.config.server_control.section.reloading.core"
                      )}
                    </op-call-service-button>
                  </div>
                  ${this._reloadableDomains.map(
                    (domain) =>
                      html`<div class="card-actions">
                        <op-call-service-button
                          .opp=${this.opp}
                          .domain=${domain}
                          service="reload"
                          >${this.opp.localize(
                            `ui.panel.config.server_control.section.reloading.${domain}`
                          ) ||
                          this.opp.localize(
                            "ui.panel.config.server_control.section.reloading.reload",
                            "domain",
                            domainToName(this.opp.localize, domain)
                          )}
                        </op-call-service-button>
                      </div>`
                  )}
                </op-card>
              `
            : ""}
        </op-config-section>
      </opp-tabs-subpage>
    `;
  }

  private async _validateConfig() {
    this._validating = true;
    this._validateLog = "";
    this._isValid = null;

    const configCheck = await checkCoreConfig(this.opp);
    this._validating = false;
    this._isValid = configCheck.result === "valid";

    if (configCheck.errors) {
      this._validateLog = configCheck.errors;
    }
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        .validate-container {
          height: 140px;
        }

        .validate-result {
          color: var(--success-color);
          font-weight: 500;
          margin-bottom: 1em;
        }

        .config-invalid {
          margin: 1em 0;
        }

        .config-invalid .text {
          color: var(--error-color);
          font-weight: 500;
        }

        .config-invalid mwc-button {
          float: right;
        }

        .validate-log {
          white-space: pre-line;
          direction: ltr;
        }

        ha-config-section {
          padding-bottom: 24px;
        }
      `,
    ];
  }
}
