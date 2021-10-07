import "@material/mwc-button/mwc-button";
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
import "../../../../../components/buttons/ha-call-service-button";
import "../../../../../components/ha-card";
import "../../../../../components/op-icon-next";
import {
  fetchOZWNodeConfig,
  fetchOZWNodeMetadata,
  fetchOZWNodeStatus,
  OZWDevice,
  OZWDeviceConfig,
  OZWDeviceMetaDataResponse,
} from "../../../../../data/ozw";
import { ERR_NOT_FOUND } from "../../../../../data/websocket_api";
import "../../../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../ha-config-section";
import { ozwNodeTabs } from "./ozw-node-router";
import { showOZWRefreshNodeDialog } from "./show-dialog-ozw-refresh-node";

@customElement("ozw-node-config")
class OZWNodeConfig extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  @property() public ozwInstance?;

  @property() public nodeId?;

  @internalProperty() private _node?: OZWDevice;

  @internalProperty() private _metadata?: OZWDeviceMetaDataResponse;

  @internalProperty() private _config?: OZWDeviceConfig[];

  @internalProperty() private _error?: string;

  protected firstUpdated() {
    if (!this.ozwInstance) {
      navigate(this, "/config/ozw/dashboard", true);
    } else if (!this.nodeId) {
      navigate(this, `/config/ozw/network/${this.ozwInstance}/nodes`, true);
    } else {
      this._fetchData();
    }
  }

  protected render(): TemplateResult {
    if (this._error) {
      return html`
        <opp-error-screen
          .opp=${this.opp}
          .error=${this.opp.localize("ui.panel.config.ozw.node." + this._error)}
        ></opp-error-screen>
      `;
    }

    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${ozwNodeTabs(this.ozwInstance, this.nodeId)}
      >
        <op-config-section .narrow=${this.narrow} .isWide=${this.isWide}>
          <div slot="header">
            ${this.opp.localize("ui.panel.config.ozw.node_config.header")}
          </div>

          <div slot="introduction">
            ${this.opp.localize("ui.panel.config.ozw.node_config.introduction")}
            <p>
              <em>
                ${this.opp.localize(
                  "ui.panel.config.ozw.node_config.help_source"
                )}
              </em>
            </p>
            <p>
              Note: This panel is currently read-only. The ability to change
              values will come in a later update.
            </p>
          </div>
          ${this._node
            ? html`
                <op-card class="content">
                  <div class="card-content">
                    <b>
                      ${this._node.node_manufacturer_name}
                      ${this._node.node_product_name} </b
                    ><br />
                    ${this.opp.localize("ui.panel.config.ozw.common.node_id")}:
                    ${this._node.node_id}<br />
                    ${this.opp.localize(
                      "ui.panel.config.ozw.common.query_stage"
                    )}:
                    ${this._node.node_query_stage}
                    ${this._metadata?.metadata.ProductManualURL
                      ? html` <a
                          href="${this._metadata.metadata.ProductManualURL}"
                        >
                          <p>
                            ${this.opp.localize(
                              "ui.panel.config.ozw.node_metadata.product_manual"
                            )}
                          </p>
                        </a>`
                      : ``}
                  </div>
                  <div class="card-actions">
                    <mwc-button @click=${this._refreshNodeClicked}>
                      ${this.opp.localize(
                        "ui.panel.config.ozw.refresh_node.button"
                      )}
                    </mwc-button>
                  </div>
                </op-card>

                ${this._metadata?.metadata.WakeupHelp
                  ? html`
                      <op-card
                        class="content"
                        header="${this.opp.localize(
                          "ui.panel.config.ozw.common.wakeup_instructions"
                        )}"
                      >
                        <div class="card-content">
                          <span class="secondary">
                            ${this.opp.localize(
                              "ui.panel.config.ozw.node_config.wakeup_help"
                            )}
                          </span>
                          <p>${this._metadata.metadata.WakeupHelp}</p>
                        </div>
                      </op-card>
                    `
                  : ``}
                ${this._config
                  ? html`
                      ${this._config.map(
                        (item) => html`
                          <op-card class="content">
                            <div class="card-content">
                              <b>${item.label}</b><br />
                              <span class="secondary">${item.help}</span>
                              <p>${item.value}</p>
                            </div>
                          </op-card>
                        `
                      )}
                    `
                  : ``}
              `
            : ``}
        </op-config-section>
      </opp-tabs-subpage>
    `;
  }

  private async _fetchData() {
    if (!this.ozwInstance || !this.nodeId) {
      return;
    }

    try {
      const nodeProm = fetchOZWNodeStatus(
        this.opp!,
        this.ozwInstance,
        this.nodeId
      );
      const metadataProm = fetchOZWNodeMetadata(
        this.opp!,
        this.ozwInstance,
        this.nodeId
      );
      const configProm = fetchOZWNodeConfig(
        this.opp!,
        this.ozwInstance,
        this.nodeId
      );
      [this._node, this._metadata, this._config] = await Promise.all([
        nodeProm,
        metadataProm,
        configProm,
      ]);
    } catch (err) {
      if (err.code === ERR_NOT_FOUND) {
        this._error = ERR_NOT_FOUND;
        return;
      }
      throw err;
    }
  }

  private async _refreshNodeClicked() {
    showOZWRefreshNodeDialog(this, {
      node_id: this.nodeId,
      ozw_instance: this.ozwInstance,
    });
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        .secondary {
          color: var(--secondary-text-color);
          font-size: 0.9em;
        }

        .content {
          margin-top: 24px;
        }

        .sectionHeader {
          position: relative;
          padding-right: 40px;
        }

        ha-card {
          margin: 0 auto;
          max-width: 600px;
        }

        [hidden] {
          display: none;
        }

        blockquote {
          display: block;
          background-color: #ddd;
          padding: 8px;
          margin: 8px 0;
          font-size: 0.9em;
        }

        blockquote em {
          font-size: 0.9em;
          margin-top: 6px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ozw-node-config": OZWNodeConfig;
  }
}
