import "@material/mwc-button";
import "@material/mwc-list/mwc-list-item";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../../src/common/dom/fire_event";
import "../../../src/components/buttons/ha-progress-button";
import "../../../src/components/op-button-menu";
import "../../../src/components/ha-card";
import "../../../src/components/op-settings-row";
import {
  extractApiErrorMessage,
  fetchOppioStats,
  OppioStats,
} from "../../../src/data/oppio/common";
import { restartCore, updateCore } from "../../../src/data/supervisor/core";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../src/dialogs/generic/show-dialog-box";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower } from "../../../src/types";
import { bytesToString } from "../../../src/util/bytes-to-string";
import "../components/supervisor-metric";
import { showDialogSupervisorUpdate } from "../dialogs/update/show-dialog-update";
import { oppioStyle } from "../resources/oppio-style";

@customElement("oppio-core-info")
class OppioCoreInfo extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @state() private _metrics?: OppioStats;

  protected render(): TemplateResult | void {
    const metrics = [
      {
        description: this.supervisor.localize("system.core.cpu_usage"),
        value: this._metrics?.cpu_percent,
      },
      {
        description: this.supervisor.localize("system.core.ram_usage"),
        value: this._metrics?.memory_percent,
        tooltip: `${bytesToString(this._metrics?.memory_usage)}/${bytesToString(
          this._metrics?.memory_limit
        )}`,
      },
    ];

    return html`
      <op-card header="Core">
        <div class="card-content">
          <div>
            <op-settings-row>
              <span slot="heading">
                ${this.supervisor.localize("common.version")}
              </span>
              <span slot="description">
                core-${this.supervisor.core.version}
              </span>
            </op-settings-row>
            <op-settings-row>
              <span slot="heading">
                ${this.supervisor.localize("common.newest_version")}
              </span>
              <span slot="description">
                core-${this.supervisor.core.version_latest}
              </span>
              ${this.supervisor.core.update_available
                ? html`
                    <op-progress-button
                      .title=${this.supervisor.localize("common.update")}
                      @click=${this._coreUpdate}
                    >
                      ${this.supervisor.localize("common.update")}
                    </op-progress-button>
                  `
                : ""}
            </op-settings-row>
          </div>
          <div>
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
          <op-progress-button
            slot="primaryAction"
            class="warning"
            @click=${this._coreRestart}
            .title=${this.supervisor.localize(
              "common.restart_name",
              "name",
              "Core"
            )}
          >
            ${this.supervisor.localize("common.restart_name", "name", "Core")}
          </op-progress-button>
        </div>
      </op-card>
    `;
  }

  protected firstUpdated(): void {
    this._loadData();
  }

  private async _loadData(): Promise<void> {
    this._metrics = await fetchOppioStats(this.opp, "core");
  }

  private async _coreRestart(ev: CustomEvent): Promise<void> {
    const button = ev.currentTarget as any;
    button.progress = true;

    const confirmed = await showConfirmationDialog(this, {
      title: this.supervisor.localize(
        "confirm.restart.title",
        "name",
        "Open Peer Power Core"
      ),
      text: this.supervisor.localize(
        "confirm.restart.text",
        "name",
        "Open Peer Power Core"
      ),
      confirmText: this.supervisor.localize("common.restart"),
      dismissText: this.supervisor.localize("common.cancel"),
    });

    if (!confirmed) {
      button.progress = false;
      return;
    }

    try {
      await restartCore(this.opp);
    } catch (err) {
      if (this.opp.connection.connected) {
        showAlertDialog(this, {
          title: this.supervisor.localize(
            "common.failed_to_restart_name",
            "name",
            "Open Peer PowerCore"
          ),
          text: extractApiErrorMessage(err),
        });
      }
    } finally {
      button.progress = false;
    }
  }

  private async _coreUpdate(): Promise<void> {
    showDialogSupervisorUpdate(this, {
      supervisor: this.supervisor,
      name: "Open Peer Power Core",
      version: this.supervisor.core.version_latest,
      snapshotParams: {
        name: `core_${this.supervisor.core.version}`,
        folders: ["openpeerpower"],
        openpeerpower: true,
      },
      updateHandler: async () => this._updateCore(),
    });
  }

  private async _updateCore(): Promise<void> {
    await updateCore(this.opp);
    fireEvent(this, "supervisor-collection-refresh", {
      collection: "core",
    });
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
          justify-content: flex-end;
          align-items: center;
        }
        .card-content {
          display: flex;
          flex-direction: column;
          height: calc(100% - 124px);
          justify-content: space-between;
        }
        op-settings-row {
          padding: 0;
          height: 54px;
          width: 100%;
        }
        op-settings-row[three-line] {
          height: 74px;
        }
        op-settings-row > span[slot="description"] {
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
        mwc-list-item op-svg-icon {
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-core-info": OppioCoreInfo;
  }
}
