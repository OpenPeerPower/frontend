import "@material/mwc-icon-button/mwc-icon-button";
import { mdiFolderUpload } from "@mdi/js";
import "@polymer/paper-input/paper-input-container";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators";
import { fireEvent } from "../../../src/common/dom/fire_event";
import "../../../src/components/ha-circular-progress";
import "../../../src/components/ha-file-upload";
import "../../../src/components/ha-svg-icon";
import { extractApiErrorMessage } from "../../../src/data/oppio/common";
import {
  OppioSnapshot,
  uploadSnapshot,
} from "../../../src/data/oppio/snapshot";
import { showAlertDialog } from "../../../src/dialogs/generic/show-dialog-box";
import { OpenPeerPower } from "../../../src/types";

declare global {
  interface OPPDomEvents {
    "snapshot-uploaded": { snapshot: OppioSnapshot };
  }
}

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

@customElement("oppio-upload-snapshot")
export class OppioUploadSnapshot extends LitElement {
  public opp!: OpenPeerPower;

  @state() public value: string | null = null;

  @state() private _uploading = false;

  public render(): TemplateResult {
    return html`
      <op-file-upload
        .uploading=${this._uploading}
        .icon=${mdiFolderUpload}
        accept="application/x-tar"
        label="Upload snapshot"
        @file-picked=${this._uploadFile}
        auto-open-file-dialog
      ></op-file-upload>
    `;
  }

  private async _uploadFile(ev) {
    const file = ev.detail.files[0];

    if (file.size > MAX_FILE_SIZE) {
      showAlertDialog(this, {
        title: "Snapshot file is too big",
        text: html`The maximum allowed filesize is 1GB.<br />
          <a
            href="https://www.openpeerpower.io/oppio/haos_common_tasks/#restoring-a-snapshot-on-a-new-install"
            target="_blank"
            >Have a look here on how to restore it.</a
          >`,
        confirmText: "ok",
      });
      return;
    }

    if (!["application/x-tar"].includes(file.type)) {
      showAlertDialog(this, {
        title: "Unsupported file format",
        text: "Please choose a Open Peer Power snapshot file (.tar)",
        confirmText: "ok",
      });
      return;
    }
    this._uploading = true;
    try {
      const snapshot = await uploadSnapshot(this.opp, file);
      fireEvent(this, "snapshot-uploaded", { snapshot: snapshot.data });
    } catch (err) {
      showAlertDialog(this, {
        title: "Upload failed",
        text: extractApiErrorMessage(err),
        confirmText: "ok",
      });
    } finally {
      this._uploading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-upload-snapshot": OppioUploadSnapshot;
  }
}
