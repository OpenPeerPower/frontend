import "@material/mwc-button/mwc-button";
import { mdiCheckCircle, mdiCircle, mdiCloseCircle, mdiZWave } from "@mdi/js";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { navigate } from "../../../../../common/navigate";
import "../../../../../components/op-card";
import "../../../../../components/op-icon-next";
import {
  fetchOZWInstances,
  networkOfflineStatuses,
  networkOnlineStatuses,
  networkStartingStatuses,
  OZWInstance,
} from "../../../../../data/ozw";
import "../../../../../layouts/opp-error-screen";
import "../../../../../layouts/opp-loading-screen";
import "../../../../../layouts/opp-tabs-subpage";
import type { PageNavigation } from "../../../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../ha-config-section";

export const ozwTabs: PageNavigation[] = [];

@customElement("ozw-config-dashboard")
class OZWConfigDashboard extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  @internalProperty() private _instances?: OZWInstance[];

  protected firstUpdated() {
    this._fetchData();
  }

  protected render(): TemplateResult {
    if (!this._instances) {
      return html`<opp-loading-screen></opp-loading-screen>`;
    }

    if (this._instances.length === 0) {
      return html`<opp-error-screen
        .opp=${this.opp}
        .error=${this.opp.localize(
          "ui.panel.config.ozw.select_instance.none_found"
        )}
      ></opp-error-screen>`;
    }

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${ozwTabs}
        back-path="/config/integrations"
      >
        <op-config-section .narrow=${this.narrow} .isWide=${this.isWide}>
          <div slot="header">
            ${this.opp.localize("ui.panel.config.ozw.select_instance.header")}
          </div>

          <div slot="introduction">
            ${this.opp.localize(
              "ui.panel.config.ozw.select_instance.introduction"
            )}
          </div>
          ${this._instances.length > 0
            ? html`
                ${this._instances.map((instance) => {
                  let status = "unknown";
                  let icon = mdiCircle;
                  if (networkOnlineStatuses.includes(instance.Status)) {
                    status = "online";
                    icon = mdiCheckCircle;
                  }
                  if (networkStartingStatuses.includes(instance.Status)) {
                    status = "starting";
                  }
                  if (networkOfflineStatuses.includes(instance.Status)) {
                    status = "offline";
                    icon = mdiCloseCircle;
                  }

                  return html`
                    <op-card>
                      <a
                        href="/config/ozw/network/${instance.ozw_instance}"
                        aria-role="option"
                        tabindex="-1"
                      >
                        <paper-icon-item>
                          <op-svg-icon .path=${mdiZWave} slot="item-icon">
                          </op-svg-icon>
                          <paper-item-body>
                            ${this.opp.localize(
                              "ui.panel.config.ozw.common.instance"
                            )}
                            ${instance.ozw_instance}
                            <div secondary>
                              <op-svg-icon
                                .path=${icon}
                                class="network-status-icon ${status}"
                              ></op-svg-icon>
                              ${this.opp.localize(
                                "ui.panel.config.ozw.network_status." + status
                              )}
                              -
                              ${this.opp.localize(
                                "ui.panel.config.ozw.network_status.details." +
                                  instance.Status.toLowerCase()
                              )}<br />
                              ${this.opp.localize(
                                "ui.panel.config.ozw.common.controller"
                              )}
                              : ${instance.getControllerPath}<br />
                              OZWDaemon ${instance.OZWDaemon_Version} (OpenZWave
                              ${instance.OpenZWave_Version})
                            </div>
                          </paper-item-body>
                          <op-icon-next></op-icon-next>
                        </paper-icon-item>
                      </a>
                    </op-card>
                  `;
                })}
              `
            : ""}
        </op-config-section>
      </opp-tabs-subpage>
    `;
  }

  private async _fetchData() {
    this._instances = await fetchOZWInstances(this.opp!);
    if (this._instances.length === 1) {
      navigate(
        this,
        `/config/ozw/network/${this._instances[0].ozw_instance}`,
        true
      );
    }
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        op-card:last-child {
          margin-bottom: 24px;
        }
        ha-config-section {
          margin-top: -12px;
        }
        :host([narrow]) ha-config-section {
          margin-top: -20px;
        }
        op-card {
          overflow: hidden;
        }
        op-card a {
          text-decoration: none;
          color: var(--primary-text-color);
        }
        paper-item-body {
          margin: 16px 0;
        }
        a {
          text-decoration: none;
          color: var(--primary-text-color);
          position: relative;
          display: block;
          outline: 0;
        }
        op-svg-icon.network-status-icon {
          height: 14px;
          width: 14px;
        }
        .online {
          color: green;
        }
        .starting {
          color: orange;
        }
        .offline {
          color: red;
        }
        op-svg-icon,
        op-icon-next {
          color: var(--secondary-text-color);
        }
        .iron-selected paper-item::before,
        a:not(.iron-selected):focus::before {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          pointer-events: none;
          content: "";
          transition: opacity 15ms linear;
          will-change: opacity;
        }
        a:not(.iron-selected):focus::before {
          background-color: currentColor;
          opacity: var(--dark-divider-opacity);
        }
        .iron-selected paper-item:focus::before,
        .iron-selected:focus paper-item::before {
          opacity: 0.2;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ozw-config-dashboard": OZWConfigDashboard;
  }
}
