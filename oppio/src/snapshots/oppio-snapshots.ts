import "@material/mwc-button";
import { ActionDetail } from "@material/mwc-list";
import "@material/mwc-list/mwc-list-item";
import { mdiDelete, mdiDotsVertical, mdiPlus } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import memoizeOne from "memoize-one";
import { atLeastVersion } from "../../../src/common/config/version";
import relativeTime from "../../../src/common/datetime/relative_time";
import { OPPDomEvent } from "../../../src/common/dom/fire_event";
import {
  DataTableColumnContainer,
  RowClickedEvent,
  SelectionChangedEvent,
} from "../../../src/components/data-table/ha-data-table";
import "../../../src/components/op-button-menu";
import "../../../src/components/ha-fab";
import { extractApiErrorMessage } from "../../../src/data/oppio/common";
import {
  fetchOppioSnapshots,
  friendlyFolderName,
  OppioSnapshot,
  reloadOppioSnapshots,
  removeSnapshot,
} from "../../../src/data/oppio/snapshot";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../src/dialogs/generic/show-dialog-box";
import "../../../src/layouts/opp-tabs-subpage-data-table";
import type { HaTabsSubpageDataTable } from "../../../src/layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../src/resources/styles";
import { OpenPeerPower, Route } from "../../../src/types";
import { showOppioCreateSnapshotDialog } from "../dialogs/snapshot/show-dialog-oppio-create-snapshot";
import { showOppioSnapshotDialog } from "../dialogs/snapshot/show-dialog-oppio-snapshot";
import { showSnapshotUploadDialog } from "../dialogs/snapshot/show-dialog-snapshot-upload";
import { supervisorTabs } from "../oppio-tabs";
import { oppioStyle } from "../resources/oppio-style";

@customElement("oppio-snapshots")
export class OppioSnapshots extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @state() private _selectedSnapshots: string[] = [];

  @state() private _snapshots?: OppioSnapshot[] = [];

  @query("opp-tabs-subpage-data-table", true)
  private _dataTable!: HaTabsSubpageDataTable;

  private _firstUpdatedCalled = false;

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.opp && this._firstUpdatedCalled) {
      this.refreshData();
    }
  }

  public async refreshData() {
    await reloadOppioSnapshots(this.opp);
    await this.fetchSnapshots();
  }

  private _computeSnapshotContent = (snapshot: OppioSnapshot): string => {
    if (snapshot.type === "full") {
      return this.supervisor.localize("snapshot.full_snapshot");
    }
    const content: string[] = [];
    if (snapshot.content.openpeerpower) {
      content.push("Open Peer Power");
    }
    if (snapshot.content.folders.length !== 0) {
      for (const folder of snapshot.content.folders) {
        content.push(friendlyFolderName[folder] || folder);
      }
    }

    if (snapshot.content.addons.length !== 0) {
      for (const addon of snapshot.content.addons) {
        content.push(
          this.supervisor.supervisor.addons.find(
            (entry) => entry.slug === addon
          )?.name || addon
        );
      }
    }

    return content.join(", ");
  };

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.opp && this.isConnected) {
      this.refreshData();
    }
    this._firstUpdatedCalled = true;
  }

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer => ({
      name: {
        title: this.supervisor?.localize("snapshot.name") || "",
        sortable: true,
        filterable: true,
        grows: true,
        template: (entry: string, snapshot: any) =>
          html`${entry || snapshot.slug}
            <div class="secondary">${snapshot.secondary}</div>`,
      },
      date: {
        title: this.supervisor?.localize("snapshot.created") || "",
        width: "15%",
        direction: "desc",
        hidden: narrow,
        filterable: true,
        sortable: true,
        template: (entry: string) =>
          relativeTime(new Date(entry), this.opp.localize),
      },
      secondary: {
        title: "",
        hidden: true,
        filterable: true,
      },
    })
  );

  private _snapshotData = memoizeOne((snapshots: OppioSnapshot[]) =>
    snapshots.map((snapshot) => ({
      ...snapshot,
      secondary: this._computeSnapshotContent(snapshot),
    }))
  );

  protected render(): TemplateResult {
    if (!this.supervisor) {
      return html``;
    }
    return html`
      <opp-tabs-subpage-data-table
        .tabs=${supervisorTabs}
        .opp=${this.opp}
        .localizeFunc=${this.supervisor.localize}
        .searchLabel=${this.supervisor.localize("search")}
        .noDataText=${this.supervisor.localize("snapshot.no_snapshots")}
        .narrow=${this.narrow}
        .route=${this.route}
        .columns=${this._columns(this.narrow)}
        .data=${this._snapshotData(this._snapshots || [])}
        id="slug"
        @row-click=${this._handleRowClicked}
        @selection-changed=${this._handleSelectionChanged}
        clickable
        selectable
        hasFab
        main-page
        supervisor
      >
        <op-button-menu
          corner="BOTTOM_START"
          slot="toolbar-icon"
          @action=${this._handleAction}
        >
          <mwc-icon-button slot="trigger" alt="menu">
            <op-svg-icon .path=${mdiDotsVertical}></op-svg-icon>
          </mwc-icon-button>
          <mwc-list-item>
            ${this.supervisor?.localize("common.reload")}
          </mwc-list-item>
          ${atLeastVersion(this.opp.config.version, 0, 116)
            ? html`<mwc-list-item>
                ${this.supervisor?.localize("snapshot.upload_snapshot")}
              </mwc-list-item>`
            : ""}
        </op-button-menu>

        ${this._selectedSnapshots.length
          ? html`<div
              class=${classMap({
                "header-toolbar": this.narrow,
                "table-header": !this.narrow,
              })}
              slot="header"
            >
              <p class="selected-txt">
                ${this.supervisor.localize("snapshot.selected", {
                  number: this._selectedSnapshots.length,
                })}
              </p>
              <div class="header-btns">
                ${!this.narrow
                  ? html`
                      <mwc-button
                        @click=${this._deleteSelected}
                        class="warning"
                      >
                        ${this.supervisor.localize("snapshot.delete_selected")}
                      </mwc-button>
                    `
                  : html`
                      <mwc-icon-button
                        id="delete-btn"
                        class="warning"
                        @click=${this._deleteSelected}
                      >
                        <op-svg-icon .path=${mdiDelete}></op-svg-icon>
                      </mwc-icon-button>
                      <paper-tooltip animation-delay="0" for="delete-btn">
                        ${this.supervisor.localize("snapshot.delete_selected")}
                      </paper-tooltip>
                    `}
              </div>
            </div> `
          : ""}

        <op-fab
          slot="fab"
          @click=${this._createSnapshot}
          .label=${this.supervisor.localize("snapshot.create_snapshot")}
          extended
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  private _handleAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this.refreshData();
        break;
      case 1:
        this._showUploadSnapshotDialog();
        break;
    }
  }

  private _handleSelectionChanged(
    ev: OPPDomEvent<SelectionChangedEvent>
  ): void {
    this._selectedSnapshots = ev.detail.value;
  }

  private _showUploadSnapshotDialog() {
    showSnapshotUploadDialog(this, {
      showSnapshot: (slug: string) =>
        showOppioSnapshotDialog(this, {
          slug,
          supervisor: this.supervisor,
          onDelete: () => this.fetchSnapshots(),
        }),
      reloadSnapshot: () => this.refreshData(),
    });
  }

  private async fetchSnapshots() {
    await reloadOppioSnapshots(this.opp);
    this._snapshots = await fetchOppioSnapshots(this.opp);
  }

  private async _deleteSelected() {
    const confirm = await showConfirmationDialog(this, {
      title: this.supervisor.localize("snapshot.delete_snapshot_title"),
      text: this.supervisor.localize("snapshot.delete_snapshot_text", {
        number: this._selectedSnapshots.length,
      }),
      confirmText: this.supervisor.localize("snapshot.delete_snapshot_confirm"),
    });

    if (!confirm) {
      return;
    }

    try {
      await Promise.all(
        this._selectedSnapshots.map((slug) => removeSnapshot(this.opp, slug))
      );
    } catch (err) {
      showAlertDialog(this, {
        title: this.supervisor.localize("snapshot.failed_to_delete"),
        text: extractApiErrorMessage(err),
      });
      return;
    }
    await reloadOppioSnapshots(this.opp);
    this._snapshots = await fetchOppioSnapshots(this.opp);
    this._dataTable.clearSelection();
  }

  private _handleRowClicked(ev: OPPDomEvent<RowClickedEvent>) {
    const slug = ev.detail.id;
    showOppioSnapshotDialog(this, {
      slug,
      supervisor: this.supervisor,
      onDelete: () => this.fetchSnapshots(),
    });
  }

  private _createSnapshot() {
    if (this.supervisor!.info.state !== "running") {
      showAlertDialog(this, {
        title: this.supervisor!.localize("snapshot.could_not_create"),
        text: this.supervisor!.localize(
          "snapshot.create_blocked_not_running",
          "state",
          this.supervisor!.info.state
        ),
      });
      return;
    }
    showOppioCreateSnapshotDialog(this, {
      supervisor: this.supervisor!,
      onCreate: () => this.fetchSnapshots(),
    });
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 58px;
          border-bottom: 1px solid rgba(var(--rgb-primary-text-color), 0.12);
        }
        .header-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--secondary-text-color);
          position: relative;
          top: -4px;
        }
        .selected-txt {
          font-weight: bold;
          padding-left: 16px;
          color: var(--primary-text-color);
        }
        .table-header .selected-txt {
          margin-top: 20px;
        }
        .header-toolbar .selected-txt {
          font-size: 16px;
        }
        .header-toolbar .header-btns {
          margin-right: -12px;
        }
        .header-btns > mwc-button,
        .header-btns > mwc-icon-button {
          margin: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-snapshots": OppioSnapshots;
  }
}
