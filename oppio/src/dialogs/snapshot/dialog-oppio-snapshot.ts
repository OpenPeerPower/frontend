import { ActionDetail } from "@material/mwc-list";
import "@material/mwc-list/mwc-list-item";
import { mdiClose, mdiDotsVertical } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../../../../src/common/dom/fire_event";
import { slugify } from "../../../../src/common/string/slugify";
import "../../../../src/components/buttons/ha-progress-button";
import "../../../../src/components/op-button-menu";
import "../../../../src/components/op-header-bar";
import "../../../../src/components/ha-svg-icon";
import { getSignedPath } from "../../../../src/data/auth";
import { extractApiErrorMessage } from "../../../../src/data/oppio/common";
import {
  fetchOppioSnapshotInfo,
  OppioSnapshotDetail,
} from "../../../../src/data/oppio/snapshot";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../../src/dialogs/generic/show-dialog-box";
import { OppDialog } from "../../../../src/dialogs/make-dialog-manager";
import { haStyle, haStyleDialog } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { fileDownload } from "../../../../src/util/file_download";
import "../../components/supervisor-snapshot-content";
import type { SupervisorSnapshotContent } from "../../components/supervisor-snapshot-content";
import { OppioSnapshotDialogParams } from "./show-dialog-oppio-snapshot";

@customElement("dialog-oppio-snapshot")
class OppioSnapshotDialog
  extends LitElement
  implements OppDialog<OppioSnapshotDialogParams>
{
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @state() private _error?: string;

  @state() private _snapshot?: OppioSnapshotDetail;

  @state() private _dialogParams?: OppioSnapshotDialogParams;

  @state() private _restoringSnapshot = false;

  @query("supervisor-snapshot-content")
  private _snapshotContent!: SupervisorSnapshotContent;

  public async showDialog(params: OppioSnapshotDialogParams) {
    this._snapshot = await fetchOppioSnapshotInfo(this.opp, params.slug);
    this._dialogParams = params;
    this._restoringSnapshot = false;
  }

  public closeDialog() {
    this._snapshot = undefined;
    this._dialogParams = undefined;
    this._restoringSnapshot = false;
    this._error = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._dialogParams || !this._snapshot) {
      return html``;
    }
    return html`
      <op-dialog
        open
        scrimClickAction
        @closed=${this.closeDialog}
        .heading=${true}
      >
        <div slot="heading">
          <op-header-bar>
            <span slot="title">${this._snapshot.name}</span>
            <mwc-icon-button slot="actionItems" dialogAction="cancel">
              <op-svg-icon .path=${mdiClose}></op-svg-icon>
            </mwc-icon-button>
          </op-header-bar>
        </div>
        ${this._restoringSnapshot
          ? html` <op-circular-progress active></op-circular-progress>`
          : html`<supervisor-snapshot-content
              .opp=${this.opp}
              .supervisor=${this._dialogParams.supervisor}
              .snapshot=${this._snapshot}
              .onboarding=${this._dialogParams.onboarding || false}
              .localize=${this._dialogParams.localize}
            >
            </supervisor-snapshot-content>`}
        ${this._error ? html`<p class="error">Error: ${this._error}</p>` : ""}

        <mwc-button
          .disabled=${this._restoringSnapshot}
          slot="secondaryAction"
          @click=${this._restoreClicked}
        >
          Restore
        </mwc-button>

        ${!this._dialogParams.onboarding
          ? html`<op-button-menu
              fixed
              slot="primaryAction"
              @action=${this._handleMenuAction}
              @closed=${(ev: Event) => ev.stopPropagation()}
            >
              <mwc-icon-button slot="trigger" alt="menu">
                <op-svg-icon .path=${mdiDotsVertical}></op-svg-icon>
              </mwc-icon-button>
              <mwc-list-item>Download Snapshot</mwc-list-item>
              <mwc-list-item class="error">Delete Snapshot</mwc-list-item>
            </op-button-menu>`
          : ""}
      </op-dialog>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      haStyleDialog,
      css`
        ha-svg-icon {
          color: var(--primary-text-color);
        }
        op-circular-progress {
          display: block;
          text-align: center;
        }
        op-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
          display: block;
        }
      `,
    ];
  }

  private _handleMenuAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._downloadClicked();
        break;
      case 1:
        this._deleteClicked();
        break;
    }
  }

  private async _restoreClicked() {
    const snapshotDetails = this._snapshotContent.snapshotDetails();
    this._restoringSnapshot = true;
    if (this._snapshotContent.snapshotType === "full") {
      await this._fullRestoreClicked(snapshotDetails);
    } else {
      await this._partialRestoreClicked(snapshotDetails);
    }
    this._restoringSnapshot = false;
  }

  private async _partialRestoreClicked(snapshotDetails) {
    if (
      this._dialogParams?.supervisor !== undefined &&
      this._dialogParams?.supervisor.info.state !== "running"
    ) {
      await showAlertDialog(this, {
        title: "Could not restore snapshot",
        text: `Restoring a snapshot is not possible right now because the system is in ${this._dialogParams?.supervisor.info.state} state.`,
      });
      return;
    }
    if (
      !(await showConfirmationDialog(this, {
        title: "Are you sure you want partially to restore this snapshot?",
        confirmText: "restore",
        dismissText: "cancel",
      }))
    ) {
      return;
    }

    if (!this._dialogParams?.onboarding) {
      this.opp
        .callApi(
          "POST",

          `oppio/snapshots/${this._snapshot!.slug}/restore/partial`,
          snapshotDetails
        )
        .then(
          () => {
            this.closeDialog();
          },
          (error) => {
            this._error = error.body.message;
          }
        );
    } else {
      fireEvent(this, "restoring");
      fetch(`/api/oppio/snapshots/${this._snapshot!.slug}/restore/partial`, {
        method: "POST",
        body: JSON.stringify(snapshotDetails),
      });
      this.closeDialog();
    }
  }

  private async _fullRestoreClicked(snapshotDetails) {
    if (
      this._dialogParams?.supervisor !== undefined &&
      this._dialogParams?.supervisor.info.state !== "running"
    ) {
      await showAlertDialog(this, {
        title: "Could not restore snapshot",
        text: `Restoring a snapshot is not possible right now because the system is in ${this._dialogParams?.supervisor.info.state} state.`,
      });
      return;
    }
    if (
      !(await showConfirmationDialog(this, {
        title:
          "Are you sure you want to wipe your system and restore this snapshot?",
        confirmText: "restore",
        dismissText: "cancel",
      }))
    ) {
      return;
    }

    if (!this._dialogParams?.onboarding) {
      this.opp
        .callApi(
          "POST",
          `oppio/snapshots/${this._snapshot!.slug}/restore/full`,
          snapshotDetails
        )
        .then(
          () => {
            this.closeDialog();
          },
          (error) => {
            this._error = error.body.message;
          }
        );
    } else {
      fireEvent(this, "restoring");
      fetch(`/api/oppio/snapshots/${this._snapshot!.slug}/restore/full`, {
        method: "POST",
        body: JSON.stringify(snapshotDetails),
      });
      this.closeDialog();
    }
  }

  private async _deleteClicked() {
    if (
      !(await showConfirmationDialog(this, {
        title: "Are you sure you want to delete this snapshot?",
        confirmText: "delete",
        dismissText: "cancel",
      }))
    ) {
      return;
    }

    this.opp

      .callApi("POST", `oppio/snapshots/${this._snapshot!.slug}/remove`)
      .then(
        () => {
          if (this._dialogParams!.onDelete) {
            this._dialogParams!.onDelete();
          }
          this.closeDialog();
        },
        (error) => {
          this._error = error.body.message;
        }
      );
  }

  private async _downloadClicked() {
    let signedPath: { path: string };
    try {
      signedPath = await getSignedPath(
        this.opp,
        `/api/oppio/snapshots/${this._snapshot!.slug}/download`
      );
    } catch (err) {
      await showAlertDialog(this, {
        text: extractApiErrorMessage(err),
      });
      return;
    }

    if (window.location.href.includes("ui.nabu.casa")) {
      const confirm = await showConfirmationDialog(this, {
        title: "Potential slow download",
        text: "Downloading snapshots over the Nabu Casa URL will take some time, it is recomended to use your local URL instead, do you want to continue?",
        confirmText: "continue",
        dismissText: "cancel",
      });
      if (!confirm) {
        return;
      }
    }

    fileDownload(
      this,
      signedPath.path,
      `open_peer_power_snapshot_${slugify(this._computeName)}.tar`
    );
  }

  private get _computeName() {
    return this._snapshot
      ? this._snapshot.name || this._snapshot.slug
      : "Unnamed snapshot";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-oppio-snapshot": OppioSnapshotDialog;
  }
}
