import "@material/mwc-button";
import { mdiClose, mdiDelete, mdiDownload, mdiHistory } from "@mdi/js";
import "@polymer/paper-checkbox/paper-checkbox";
import type { PaperCheckboxElement } from "@polymer/paper-checkbox/paper-checkbox";
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
import { fireEvent } from "../../../../src/common/dom/fire_event";
import "../../../../src/components/ha-header-bar";
import "../../../../src/components/ha-svg-icon";
import { getSignedPath } from "../../../../src/data/auth";
import { extractApiErrorMessage } from "../../../../src/data/oppio/common";
import {
  fetchOppioSnapshotInfo,
  OppioSnapshotDetail,
} from "../../../../src/data/oppio/snapshot";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../../src/dialogs/generic/show-dialog-box";
import { PolymerChangedEvent } from "../../../../src/polymer-types";
import { haStyle, haStyleDialog } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { OppioSnapshotDialogParams } from "./show-dialog-oppio-snapshot";

const _computeFolders = (folders) => {
  const list: Array<{ slug: string; name: string; checked: boolean }> = [];
  if (folders.includes("openpeerpower")) {
    list.push({
      slug: "openpeerpower",
      name: "Open Peer Power configuration",
      checked: true,
    });
  }
  if (folders.includes("ssl")) {
    list.push({ slug: "ssl", name: "SSL", checked: true });
  }
  if (folders.includes("share")) {
    list.push({ slug: "share", name: "Share", checked: true });
  }
  if (folders.includes("addons/local")) {
    list.push({ slug: "addons/local", name: "Local add-ons", checked: true });
  }
  return list;
};

const _computeAddons = (addons) => {
  return addons.map((addon) => ({
    slug: addon.slug,
    name: addon.name,
    version: addon.version,
    checked: true,
  }));
};

interface AddonItem {
  slug: string;
  name: string;
  version: string;
  checked: boolean | null | undefined;
}

interface FolderItem {
  slug: string;
  name: string;
  checked: boolean | null | undefined;
}

@customElement("dialog-oppio-snapshot")
class OppioSnapshotDialog extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor?: Supervisor;

  @internalProperty() private _error?: string;

  @internalProperty() private _onboarding = false;

  @internalProperty() private _snapshot?: OppioSnapshotDetail;

  @internalProperty() private _folders!: FolderItem[];

  @internalProperty() private _addons!: AddonItem[];

  @internalProperty() private _dialogParams?: OppioSnapshotDialogParams;

  @internalProperty() private _snapshotPassword!: string;

  @internalProperty() private _restoreOpp = true;

  public async showDialog(params: OppioSnapshotDialogParams) {
    this._snapshot = await fetchOppioSnapshotInfo(this.opp, params.slug);
    this._folders = _computeFolders(
      this._snapshot?.folders
    ).sort((a: FolderItem, b: FolderItem) => (a.name > b.name ? 1 : -1));
    this._addons = _computeAddons(
      this._snapshot?.addons
    ).sort((a: AddonItem, b: AddonItem) => (a.name > b.name ? 1 : -1));

    this._dialogParams = params;
    this._onboarding = params.onboarding ?? false;
    this.supervisor = params.supervisor;
    if (!this._snapshot.openpeerpower) {
      this._restoreOpp = false;
    }
  }

  protected render(): TemplateResult {
    if (!this._dialogParams || !this._snapshot) {
      return html``;
    }
    return html`
      <ha-dialog open @closing=${this._closeDialog} .heading=${true}>
        <div slot="heading">
          <ha-header-bar>
            <span slot="title">
              ${this._computeName}
            </span>
            <mwc-icon-button slot="actionItems" dialogAction="cancel">
              <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
            </mwc-icon-button>
          </ha-header-bar>
        </div>
        <div class="details">
          ${this._snapshot.type === "full"
            ? "Full snapshot"
            : "Partial snapshot"}
          (${this._computeSize})<br />
          ${this._formatDatetime(this._snapshot.date)}
        </div>
        ${this._snapshot.openpeerpower
          ? html`<div>Open Peer Power:</div>
              <paper-checkbox
                .checked=${this._restoreOpp}
                @change="${(ev: Event) => {
                  this._restoreOpp = (ev.target as PaperCheckboxElement).checked!;
                }}"
              >
                Open Peer Power ${this._snapshot.openpeerpower}
              </paper-checkbox>`
          : ""}
        ${this._folders.length
          ? html`
              <div>Folders:</div>
              <paper-dialog-scrollable class="no-margin-top">
                ${this._folders.map((item) => {
                  return html`
                    <paper-checkbox
                      .checked=${item.checked}
                      @change="${(ev: Event) =>
                        this._updateFolders(
                          item,
                          (ev.target as PaperCheckboxElement).checked
                        )}"
                    >
                      ${item.name}
                    </paper-checkbox>
                  `;
                })}
              </paper-dialog-scrollable>
            `
          : ""}
        ${this._addons.length
          ? html`
              <div>Add-on:</div>
              <paper-dialog-scrollable class="no-margin-top">
                ${this._addons.map((item) => {
                  return html`
                    <paper-checkbox
                      .checked=${item.checked}
                      @change="${(ev: Event) =>
                        this._updateAddons(
                          item,
                          (ev.target as PaperCheckboxElement).checked
                        )}"
                    >
                      ${item.name}
                    </paper-checkbox>
                  `;
                })}
              </paper-dialog-scrollable>
            `
          : ""}
        ${this._snapshot.protected
          ? html`
              <paper-input
                autofocus=""
                label="Password"
                type="password"
                @value-changed=${this._passwordInput}
                .value=${this._snapshotPassword}
              ></paper-input>
            `
          : ""}
        ${this._error ? html` <p class="error">Error: ${this._error}</p> ` : ""}

        <div class="button-row" slot="primaryAction">
          <mwc-button @click=${this._partialRestoreClicked}>
            <ha-svg-icon .path=${mdiHistory} class="icon"></ha-svg-icon>
            Restore Selected
          </mwc-button>
          ${!this._onboarding
            ? html`
                <mwc-button @click=${this._deleteClicked}>
                  <ha-svg-icon .path=${mdiDelete} class="icon warning">
                  </ha-svg-icon>
                  <span class="warning">Delete Snapshot</span>
                </mwc-button>
              `
            : ""}
        </div>
        <div class="button-row" slot="secondaryAction">
          ${this._snapshot.type === "full"
            ? html`
                <mwc-button @click=${this._fullRestoreClicked}>
                  <ha-svg-icon .path=${mdiHistory} class="icon"></ha-svg-icon>
                  Restore Everything
                </mwc-button>
              `
            : ""}
          ${!this._onboarding
            ? html`<mwc-button @click=${this._downloadClicked}>
                <ha-svg-icon .path=${mdiDownload} class="icon"></ha-svg-icon>
                Download Snapshot
              </mwc-button>`
            : ""}
        </div>
      </ha-dialog>
    `;
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      haStyleDialog,
      css`
        paper-checkbox {
          display: block;
          margin: 4px;
        }
        mwc-button ha-svg-icon {
          margin-right: 4px;
        }
        .button-row {
          display: grid;
          gap: 8px;
          margin-right: 8px;
        }
        .details {
          color: var(--secondary-text-color);
        }
        .warning,
        .error {
          color: var(--error-color);
        }
        .buttons li {
          list-style-type: none;
        }
        .buttons .icon {
          margin-right: 16px;
        }
        .no-margin-top {
          margin-top: 0;
        }
        ha-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
        }
        /* overrule the ha-style-dialog max-height on small screens */
        @media all and (max-width: 450px), all and (max-height: 500px) {
          ha-header-bar {
            --mdc-theme-primary: var(--app-header-background-color);
            --mdc-theme-on-primary: var(--app-header-text-color, white);
          }
        }
      `,
    ];
  }

  private _updateFolders(item: FolderItem, value: boolean | null | undefined) {
    this._folders = this._folders.map((folder) => {
      if (folder.slug === item.slug) {
        folder.checked = value;
      }
      return folder;
    });
  }

  private _updateAddons(item: AddonItem, value: boolean | null | undefined) {
    this._addons = this._addons.map((addon) => {
      if (addon.slug === item.slug) {
        addon.checked = value;
      }
      return addon;
    });
  }

  private _passwordInput(ev: PolymerChangedEvent<string>) {
    this._snapshotPassword = ev.detail.value;
  }

  private async _partialRestoreClicked() {
    if (
      this.supervisor !== undefined &&
      this.supervisor.info.state !== "running"
    ) {
      await showAlertDialog(this, {
        title: "Could not restore snapshot",
        text: `Restoring a snapshot is not possible right now because the system is in ${this.supervisor.info.state} state.`,
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

    const addons = this._addons
      .filter((addon) => addon.checked)
      .map((addon) => addon.slug);

    const folders = this._folders
      .filter((folder) => folder.checked)
      .map((folder) => folder.slug);

    const data: {
      openpeerpower: boolean;
      addons: any;
      folders: any;
      password?: string;
    } = {
      openpeerpower: this._restoreOpp,
      addons,
      folders,
    };

    if (this._snapshot!.protected) {
      data.password = this._snapshotPassword;
    }

    if (!this._onboarding) {
      this.opp
        .callApi(
          "POST",

          `oppio/snapshots/${this._snapshot!.slug}/restore/partial`,
          data
        )
        .then(
          () => {
            alert("Snapshot restored!");
            this._closeDialog();
          },
          (error) => {
            this._error = error.body.message;
          }
        );
    } else {
      fireEvent(this, "restoring");
      fetch(`/api/oppio/snapshots/${this._snapshot!.slug}/restore/partial`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      this._closeDialog();
    }
  }

  private async _fullRestoreClicked() {
    if (
      this.supervisor !== undefined &&
      this.supervisor.info.state !== "running"
    ) {
      await showAlertDialog(this, {
        title: "Could not restore snapshot",
        text: `Restoring a snapshot is not possible right now because the system is in ${this.supervisor.info.state} state.`,
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

    const data = this._snapshot!.protected
      ? { password: this._snapshotPassword }
      : undefined;
    if (!this._onboarding) {
      this.opp
        .callApi(
          "POST",
          `oppio/snapshots/${this._snapshot!.slug}/restore/full`,
          data
        )
        .then(
          () => {
            alert("Snapshot restored!");
            this._closeDialog();
          },
          (error) => {
            this._error = error.body.message;
          }
        );
    } else {
      fireEvent(this, "restoring");
      fetch(`/api/oppio/snapshots/${this._snapshot!.slug}/restore/full`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      this._closeDialog();
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
          this._closeDialog();
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
      alert(`Error: ${extractApiErrorMessage(err)}`);
      return;
    }

    if (window.location.href.includes("ui.nabu.casa")) {
      const confirm = await showConfirmationDialog(this, {
        title: "Potential slow download",
        text:
          "Downloading snapshots over the Nabu Casa URL will take some time, it is recomended to use your local URL instead, do you want to continue?",
        confirmText: "continue",
        dismissText: "cancel",
      });
      if (!confirm) {
        return;
      }
    }

    const name = this._computeName.replace(/[^a-z0-9]+/gi, "_");
    const a = document.createElement("a");
    a.href = signedPath.path;
    a.download = `Opp_io_${name}.tar`;
    this.shadowRoot!.appendChild(a);
    a.click();
    this.shadowRoot!.removeChild(a);
  }

  private get _computeName() {
    return this._snapshot
      ? this._snapshot.name || this._snapshot.slug
      : "Unnamed snapshot";
  }

  private get _computeSize() {
    return Math.ceil(this._snapshot!.size * 10) / 10 + " MB";
  }

  private _formatDatetime(datetime) {
    return new Date(datetime).toLocaleDateString(navigator.language, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  private _closeDialog() {
    this._dialogParams = undefined;
    this._snapshot = undefined;
    this._snapshotPassword = "";
    this._folders = [];
    this._addons = [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-oppio-snapshot": OppioSnapshotDialog;
  }
}
