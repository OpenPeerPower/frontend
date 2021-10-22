import "@material/mwc-button/mwc-button";
import "@material/mwc-icon-button/mwc-icon-button";
import { mdiCheckCircle, mdiCircle, mdiRefresh } from "@mdi/js";
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
import { classMap } from "lit-html/directives/class-map";
import "../../../../../components/op-card";
import "../../../../../components/op-svg-icon";
import "../../../../../components/op-icon-next";
import { getSignedPath } from "../../../../../data/auth";
import {
  fetchNetworkStatus,
  fetchNodeStatus,
  NodeStatus,
  ZWaveJSNetwork,
  ZWaveJSNode,
} from "../../../../../data/zwave_js";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../../../dialogs/generic/show-dialog-box";
import "../../../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../op-config-section";
import { showZWaveJSAddNodeDialog } from "./show-dialog-zwave_js-add-node";
import { showZWaveJSRemoveNodeDialog } from "./show-dialog-zwave_js-remove-node";
import { configTabs } from "./zwave_js-config-router";

@customElement("zwave_js-config-dashboard")
class ZWaveJSConfigDashboard extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  @internalProperty() private _network?: ZWaveJSNetwork;

  @internalProperty() private _nodes?: ZWaveJSNode[];

  @internalProperty() private _status = "unknown";

  @internalProperty() private _icon = mdiCircle;

  protected firstUpdated() {
    if (this.opp) {
      this._fetchData();
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${configTabs}
      >
        <mwc-icon-button slot="toolbar-icon" @click=${this._fetchData}>
          <op-svg-icon .path=${mdiRefresh}></op-svg-icon>
        </mwc-icon-button>
        <op-config-section .narrow=${this.narrow} .isWide=${this.isWide}>
          <div slot="header">
            ${this.opp.localize("ui.panel.config.zwave_js.dashboard.header")}
          </div>

          <div slot="introduction">
            ${this.opp.localize(
              "ui.panel.config.zwave_js.dashboard.introduction"
            )}
          </div>
          ${this._network
            ? html`
                <op-card class="content network-status">
                  <div class="card-content">
                    <div class="heading">
                      <div class="icon">
                        ${this._status === "connecting"
                          ? html`<op-circular-progress
                              active
                            ></op-circular-progress>`
                          : html`
                              <op-svg-icon
                                .path=${this._icon}
                                class="network-status-icon ${classMap({
                                  [this._status]: true,
                                })}"
                                slot="item-icon"
                              ></op-svg-icon>
                            `}
                      </div>
                      ${this._status !== "connecting"
                        ? html`
                            <div class="details">
                              ${this.opp.localize(
                                "ui.panel.config.zwave_js.common.network"
                              )}
                              ${this.opp.localize(
                                `ui.panel.config.zwave_js.network_status.${this._status}`
                              )}<br />
                              <small
                                >${this._network.client.ws_server_url}</small
                              >
                            </div>
                          `
                        : ``}
                    </div>
                    <div class="secondary">
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.dashboard.driver_version"
                      )}:
                      ${this._network.client.driver_version}<br />
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.dashboard.server_version"
                      )}:
                      ${this._network.client.server_version}<br />
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.dashboard.home_id"
                      )}:
                      ${this._network.controller.home_id}<br />
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.dashboard.nodes_ready"
                      )}:
                      ${this._nodes?.filter((node) => node.ready).length ?? 0} /
                      ${this._network.controller.nodes.length}
                    </div>
                  </div>
                  <div class="card-actions">
                    <a
                      href="${`/config/devices/dashboard?historyBack=1&config_entry=${this.configEntryId}`}"
                    >
                      <mwc-button>
                        ${this.opp.localize("ui.panel.config.devices.caption")}
                      </mwc-button>
                    </a>
                    <a
                      href="${`/config/entities/dashboard?historyBack=1&config_entry=${this.configEntryId}`}"
                    >
                      <mwc-button>
                        ${this.opp.localize("ui.panel.config.entities.caption")}
                      </mwc-button>
                    </a>
                    <mwc-button @click=${this._addNodeClicked}>
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.common.add_node"
                      )}
                    </mwc-button>
                    <mwc-button @click=${this._removeNodeClicked}>
                      ${this.opp.localize(
                        "ui.panel.config.zwave_js.common.remove_node"
                      )}
                    </mwc-button>
                  </div>
                </op-card>
              `
            : ``}
          <button class="link dump" @click=${this._dumpDebugClicked}>
            ${this.opp.localize(
              "ui.panel.config.zwave_js.dashboard.dump_debug"
            )}
          </button>
        </op-config-section>
      </opp-tabs-subpage>
    `;
  }

  private async _fetchData() {
    if (!this.configEntryId) {
      return;
    }
    this._network = await fetchNetworkStatus(this.opp!, this.configEntryId);
    this._status = this._network.client.state;
    if (this._status === "connected") {
      this._icon = mdiCheckCircle;
    }
    this._fetchNodeStatus();
  }

  private async _fetchNodeStatus() {
    if (!this._network) {
      return;
    }
    const nodeStatePromisses = this._network.controller.nodes.map((nodeId) =>
      fetchNodeStatus(this.opp, this.configEntryId!, nodeId)
    );
    this._nodes = await Promise.all(nodeStatePromisses);
  }

  private async _addNodeClicked() {
    showZWaveJSAddNodeDialog(this, {
      entry_id: this.configEntryId!,
    });
  }

  private async _removeNodeClicked() {
    showZWaveJSRemoveNodeDialog(this, {
      entry_id: this.configEntryId!,
    });
  }

  private async _dumpDebugClicked() {
    await this._fetchNodeStatus();

    const notReadyNodes = this._nodes?.filter((node) => !node.ready);
    const deadNodes = this._nodes?.filter(
      (node) => node.status === NodeStatus.Dead
    );

    if (deadNodes?.length) {
      await showAlertDialog(this, {
        title: this.opp.localize(
          "ui.panel.config.zwave_js.dashboard.dump_dead_nodes_title"
        ),
        text: this.opp.localize(
          "ui.panel.config.zwave_js.dashboard.dump_dead_nodes_text"
        ),
      });
    }

    if (
      notReadyNodes?.length &&
      notReadyNodes.length !== deadNodes?.length &&
      !(await showConfirmationDialog(this, {
        title: this.opp.localize(
          "ui.panel.config.zwave_js.dashboard.dump_not_ready_title"
        ),
        text: this.opp.localize(
          "ui.panel.config.zwave_js.dashboard.dump_not_ready_text"
        ),
        confirmText: this.opp.localize(
          "ui.panel.config.zwave_js.dashboard.dump_not_ready_confirm"
        ),
      }))
    ) {
      return;
    }

    let signedPath: { path: string };
    try {
      signedPath = await getSignedPath(
        this.opp,
        `/api/zwave_js/dump/${this.configEntryId}`
      );
    } catch (err) {
      showAlertDialog(this, {
        title: "Error",
        text: err.error || err.body || err,
      });
      return;
    }

    const a = document.createElement("a");
    a.href = signedPath.path;
    a.download = `zwave_js_dump.jsonl`;
    this.shadowRoot!.appendChild(a);
    a.click();
    this.shadowRoot!.removeChild(a);
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        .secondary {
          color: var(--secondary-text-color);
        }
        .connected {
          color: green;
        }
        .starting {
          color: orange;
        }
        .offline {
          color: red;
        }

        .content {
          margin-top: 24px;
        }

        .sectionHeader {
          position: relative;
          padding-right: 40px;
        }

        .network-status div.heading {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .network-status div.heading .icon {
          width: 48px;
          height: 48px;
          margin-right: 16px;
        }
        .network-status div.heading op-svg-icon {
          width: 48px;
          height: 48px;
        }
        .network-status div.heading .details {
          font-size: 1.5rem;
        }

        .network-status small {
          font-size: 1rem;
        }

        op-card {
          margin: 0 auto;
          max-width: 600px;
        }

        button.dump {
          width: 100%;
          text-align: center;
          color: var(--secondary-text-color);
        }

        [hidden] {
          display: none;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zwave_js-config-dashboard": ZWaveJSConfigDashboard;
  }
}
