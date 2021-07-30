import "@material/mwc-button";
import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import { mdiDotsVertical } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { atLeastVersion } from "../../../src/common/config/version";
import { fireEvent } from "../../../src/common/dom/fire_event";
import "../../../src/components/buttons/ha-progress-button";
import "../../../src/components/op-button-menu";
import "../../../src/components/ha-card";
import "../../../src/components/ha-settings-row";
import {
  extractApiErrorMessage,
  ignoreSupervisorError,
} from "../../../src/data/oppio/common";
import { fetchOppioHardwareInfo } from "../../../src/data/oppio/hardware";
import {
  changeHostOptions,
  configSyncOS,
  rebootHost,
  shutdownHost,
  updateOS,
} from "../../../src/data/oppio/host";
import {
  fetchNetworkInfo,
  NetworkInfo,
} from "../../../src/data/oppio/network";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import {
  showAlertDialog,
  showConfirmationDialog,
  showPromptDialog,
} from "../../../src/dialogs/generic/show-dialog-box";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower } from "../../../src/types";
import {
  getValueInPercentage,
  roundWithOneDecimal,
} from "../../../src/util/calculate";
import "../components/supervisor-metric";
import { showNetworkDialog } from "../dialogs/network/show-dialog-network";
import { showOppioHardwareDialog } from "../dialogs/hardware/show-dialog-oppio-hardware";
import { oppioStyle } from "../resources/oppio-style";

@customElement("oppio-host-info")
class OppioHostInfo extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  protected render(): TemplateResult | void {
    const primaryIpAddress = this.supervisor.host.features.includes("network")
      ? this._primaryIpAddress(this.supervisor.network!)
      : "";

    const metrics = [
      {
        description: this.supervisor.localize("system.host.used_space"),
        value: this._getUsedSpace(
          this.supervisor.host.disk_used,
          this.supervisor.host.disk_total
        ),
        tooltip: `${this.supervisor.host.disk_used} GB/${this.supervisor.host.disk_total} GB`,
      },
    ];
    return html`
      <op-card header="Host">
        <div class="card-content">
          <div>
            ${this.supervisor.host.features.includes("hostname")
              ? html`<op-settings-row>
                  <span slot="heading">
                    ${this.supervisor.localize("system.host.hostname")}
                  </span>
                  <span slot="description">
                    ${this.supervisor.host.hostname}
                  </span>
                  <mwc-button
                    .label=${this.supervisor.localize("system.host.change")}
                    @click=${this._changeHostnameClicked}
                  >
                  </mwc-button>
                </op-settings-row>`
              : ""}
            ${this.supervisor.host.features.includes("network")
              ? html` <op-settings-row>
                  <span slot="heading">
                    ${this.supervisor.localize("system.host.ip_address")}
                  </span>
                  <span slot="description"> ${primaryIpAddress} </span>
                  <mwc-button
                    .label=${this.supervisor.localize("system.host.change")}
                    @click=${this._changeNetworkClicked}
                  >
                  </mwc-button>
                </op-settings-row>`
              : ""}

            <op-settings-row>
              <span slot="heading">
                ${this.supervisor.localize("system.host.operating_system")}
              </span>
              <span slot="description">
                ${this.supervisor.host.operating_system}
              </span>
              ${this.supervisor.os.update_available
                ? html`
                    <op-progress-button @click=${this._osUpdate}>
                      ${this.supervisor.localize("commmon.update")}
                    </op-progress-button>
                  `
                : ""}
            </op-settings-row>
            ${!this.supervisor.host.features.includes("opos")
              ? html`<op-settings-row>
                  <span slot="heading">
                    ${this.supervisor.localize("system.host.docker_version")}
                  </span>
                  <span slot="description">
                    ${this.supervisor.info.docker}
                  </span>
                </op-settings-row>`
              : ""}
            ${this.supervisor.host.deployment
              ? html`<op-settings-row>
                  <span slot="heading">
                    ${this.supervisor.localize("system.host.deployment")}
                  </span>
                  <span slot="description">
                    ${this.supervisor.host.deployment}
                  </span>
                </op-settings-row>`
              : ""}
          </div>
          <div>
            ${this.supervisor.host.disk_life_time !== "" &&
            this.supervisor.host.disk_life_time >= 10
              ? html` <op-settings-row>
                  <span slot="heading">
                    ${this.supervisor.localize(
                      "system.host.emmc_lifetime_used"
                    )}
                  </span>
                  <span slot="description">
                    ${this.supervisor.host.disk_life_time - 10} % -
                    ${this.supervisor.host.disk_life_time} %
                  </span>
                </op-settings-row>`
              : ""}
            ${metrics.map(
              (metric) =>
                html`
                  <supervisor-metric
                    .description=${metric.description}
                    .value=${metric.value ?? 0}
                    .tooltip=${metric.tooltip}
                  ></supervisor-metric>
                `
            )}
          </div>
        </div>
        <div class="card-actions">
          ${this.supervisor.host.features.includes("reboot")
            ? html`
                <op-progress-button class="warning" @click=${this._hostReboot}>
                  ${this.supervisor.localize("system.host.reboot_host")}
                </op-progress-button>
              `
            : ""}
          ${this.supervisor.host.features.includes("shutdown")
            ? html`
                <op-progress-button
                  class="warning"
                  @click=${this._hostShutdown}
                >
                  ${this.supervisor.localize("system.host.shutdown_host")}
                </op-progress-button>
              `
            : ""}

          <op-button-menu
            corner="BOTTOM_START"
            @action=${this._handleMenuAction}
          >
            <mwc-icon-button slot="trigger">
              <op-svg-icon .path=${mdiDotsVertical}></op-svg-icon>
            </mwc-icon-button>
            <mwc-list-item>
              ${this.supervisor.localize("system.host.hardware")}
            </mwc-list-item>
            ${this.supervisor.host.features.includes("opos")
              ? html`<mwc-list-item>
                  ${this.supervisor.localize("system.host.import_from_usb")}
                </mwc-list-item>`
              : ""}
          </op-button-menu>
        </div>
      </op-card>
    `;
  }

  protected firstUpdated(): void {
    this._loadData();
  }

  private _getUsedSpace = memoizeOne((used: number, total: number) =>
    roundWithOneDecimal(getValueInPercentage(used, 0, total))
  );

  private _primaryIpAddress = memoizeOne((network_info: NetworkInfo) => {
    if (!network_info || !network_info.interfaces) {
      return "";
    }
    return network_info.interfaces.find((a) => a.primary)?.ipv4?.address![0];
  });

  private async _handleMenuAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        await this._showHardware();
        break;
      case 1:
        await this._importFromUSB();
        break;
    }
  }

  private async _showHardware(): Promise<void> {
    let hardware;
    try {
      hardware = await fetchOppioHardwareInfo(this.opp);
    } catch (err) {
      await showAlertDialog(this, {
        title: this.supervisor.localize(
          "system.host.failed_to_get_hardware_list"
        ),
        text: extractApiErrorMessage(err),
      });
      return;
    }
    showOppioHardwareDialog(this, { supervisor: this.supervisor, hardware });
  }

  private async _hostReboot(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const confirmed = await showConfirmationDialog(this, {
      title: this.supervisor.localize("system.host.reboot_host"),
      text: this.supervisor.localize("system.host.confirm_reboot"),
      confirmText: this.supervisor.localize("system.host.reboot_host"),
      dismissText: this.supervisor.localize("common.cancel"),
    });

    if (!confirmed) {
      button.progress = false;
      return;
    }

    try {
      await rebootHost(this.opp);
    } catch (err) {
      // Ignore connection errors, these are all expected
      if (this.opp.connection.connected && !ignoreSupervisorError(err)) {
        showAlertDialog(this, {
          title: this.supervisor.localize("system.host.failed_to_reboot"),
          text: extractApiErrorMessage(err),
        });
      }
    }
    button.progress = false;
  }

  private async _hostShutdown(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const confirmed = await showConfirmationDialog(this, {
      title: this.supervisor.localize("system.host.shutdown_host"),
      text: this.supervisor.localize("system.host.confirm_shutdown"),
      confirmText: this.supervisor.localize("system.host.shutdown_host"),
      dismissText: this.supervisor.localize("common.cancel"),
    });

    if (!confirmed) {
      button.progress = false;
      return;
    }

    try {
      await shutdownHost(this.opp);
    } catch (err) {
      // Ignore connection errors, these are all expected
      if (this.opp.connection.connected && !ignoreSupervisorError(err)) {
        showAlertDialog(this, {
          title: this.supervisor.localize("system.host.failed_to_shutdown"),
          text: extractApiErrorMessage(err),
        });
      }
    }
    button.progress = false;
  }

  private async _osUpdate(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const confirmed = await showConfirmationDialog(this, {
      title: this.supervisor.localize(
        "confirm.update.title",
        "name",
        "Open Peer Power Operating System"
      ),
      text: this.supervisor.localize(
        "confirm.update.text",
        "name",
        "Open Peer Power Operating System",
        "version",
        this.supervisor.os.version_latest
      ),
      confirmText: this.supervisor.localize("common.update"),
      dismissText: "no",
    });

    if (!confirmed) {
      button.progress = false;
      return;
    }

    try {
      await updateOS(this.opp);
      fireEvent(this, "supervisor-collection-refresh", { collection: "os" });
    } catch (err) {
      if (this.opp.connection.connected) {
        showAlertDialog(this, {
          title: this.supervisor.localize(
            "common.failed_to_update_name",
            "name",
            "Open Peer Power Operating System"
          ),
          text: extractApiErrorMessage(err),
        });
      }
    }
    button.progress = false;
  }

  private async _changeNetworkClicked(): Promise<void> {
    showNetworkDialog(this, {
      supervisor: this.supervisor,
      loadData: () => this._loadData(),
    });
  }

  private async _changeHostnameClicked(): Promise<void> {
    const curHostname: string = this.supervisor.host.hostname;
    const hostname = await showPromptDialog(this, {
      title: this.supervisor.localize("system.host.change_hostname"),
      inputLabel: this.supervisor.localize("system.host.new_hostname"),
      inputType: "string",
      defaultValue: curHostname,
      confirmText: this.supervisor.localize("common.update"),
    });

    if (hostname && hostname !== curHostname) {
      try {
        await changeHostOptions(this.opp, { hostname });
        fireEvent(this, "supervisor-collection-refresh", {
          collection: "host",
        });
      } catch (err) {
        showAlertDialog(this, {
          title: this.supervisor.localize("system.host.failed_to_set_hostname"),
          text: extractApiErrorMessage(err),
        });
      }
    }
  }

  private async _importFromUSB(): Promise<void> {
    try {
      await configSyncOS(this.opp);
      fireEvent(this, "supervisor-collection-refresh", {
        collection: "host",
      });
    } catch (err) {
      showAlertDialog(this, {
        title: this.supervisor.localize(
          "system.host.failed_to_import_from_usb"
        ),
        text: extractApiErrorMessage(err),
      });
    }
  }

  private async _loadData(): Promise<void> {
    if (atLeastVersion(this.opp.config.version, 2021, 2, 4)) {
      fireEvent(this, "supervisor-collection-refresh", {
        collection: "network",
      });
    } else {
      const network = await fetchNetworkInfo(this.opp);
      fireEvent(this, "supervisor-update", { network });
    }
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        ha-card {
          height: 100%;
          justify-content: space-between;
          flex-direction: column;
          display: flex;
        }
        .card-actions {
          height: 48px;
          border-top: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-content {
          display: flex;
          flex-direction: column;
          height: calc(100% - 124px);
          justify-content: space-between;
        }
        ha-settings-row {
          padding: 0;
          height: 54px;
          width: 100%;
        }
        ha-settings-row[three-line] {
          height: 74px;
        }
        ha-settings-row > span[slot="description"] {
          white-space: normal;
          color: var(--secondary-text-color);
        }

        .warning {
          --mdc-theme-primary: var(--error-color);
        }

        op-button-menu {
          color: var(--secondary-text-color);
          --mdc-menu-min-width: 200px;
        }
        @media (min-width: 563px) {
          paper-listbox {
            max-height: 150px;
            overflow: auto;
          }
        }
        paper-item {
          cursor: pointer;
          min-height: 35px;
        }
        mwc-list-item ha-svg-icon {
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-host-info": OppioHostInfo;
  }
}
