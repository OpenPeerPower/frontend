import "@material/mwc-icon-button/mwc-icon-button";
import { mdiImagePlus } from "@mdi/js";
import "@polymer/paper-input/paper-input-container";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { createImage, generateImageThumbnailUrl } from "../data/image";
import { showAlertDialog } from "../dialogs/generic/show-dialog-box";
import {
  CropOptions,
  showImageCropperDialog,
} from "../dialogs/image-cropper-dialog/show-image-cropper-dialog";
import { OpenPeerPower } from "../types";
import "./op-circular-progress";
import "./op-file-upload";
import "./op-svg-icon";

@customElement("op-picture-upload")
export class HaPictureUpload extends LitElement {
  public opp!: OpenPeerPower;

  @property() public value: string | null = null;

  @property() public label?: string;

  @property({ type: Boolean }) public crop = false;

  @property({ attribute: false }) public cropOptions?: CropOptions;

  @property({ type: Number }) public size = 512;

  @state() private _uploading = false;

  public render(): TemplateResult {
    return html`
      <op-file-upload
        .icon=${mdiImagePlus}
        .label=${this.label ||
        this.opp.localize("ui.components.picture-upload.label")}
        .uploading=${this._uploading}
        .value=${this.value ? html`<img .src=${this.value} />` : ""}
        @file-picked=${this._handleFilePicked}
        accept="image/png, image/jpeg, image/gif"
      ></op-file-upload>
    `;
  }

  private async _handleFilePicked(ev) {
    const file = ev.detail.files[0];
    if (this.crop) {
      this._cropFile(file);
    } else {
      this._uploadFile(file);
    }
  }

  private async _cropFile(file: File) {
    if (!["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
      showAlertDialog(this, {
        text: this.opp.localize(
          "ui.components.picture-upload.unsupported_format"
        ),
      });
      return;
    }
    showImageCropperDialog(this, {
      file,
      options: this.cropOptions || {
        round: false,
        aspectRatio: NaN,
      },
      croppedCallback: (croppedFile) => {
        this._uploadFile(croppedFile);
      },
    });
  }

  private async _uploadFile(file: File) {
    if (!["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
      showAlertDialog(this, {
        text: this.opp.localize(
          "ui.components.picture-upload.unsupported_format"
        ),
      });
      return;
    }
    this._uploading = true;
    try {
      const media = await createImage(this.opp, file);
      this.value = generateImageThumbnailUrl(media.id, this.size);
      fireEvent(this, "change");
    } catch (err) {
      showAlertDialog(this, {
        text: err.toString(),
      });
    } finally {
      this._uploading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-picture-upload": HaPictureUpload;
  }
}
