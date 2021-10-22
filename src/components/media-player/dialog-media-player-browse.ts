import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent, OPPDomEvent } from "../../common/dom/fire_event";
import type {
  MediaPickedEvent,
  MediaPlayerBrowseAction,
} from "../../data/media-player";
import { haStyleDialog } from "../../resources/styles";
import type { OpenPeerPower } from "../../types";
import "../op-dialog";
import "./op-media-player-browse";
import { MediaPlayerBrowseDialogParams } from "./show-media-browser-dialog";

@customElement("dialog-media-player-browse")
class DialogMediaPlayerBrowse extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @state() private _entityId!: string;

  @state() private _mediaContentId?: string;

  @state() private _mediaContentType?: string;

  @state() private _action?: MediaPlayerBrowseAction;

  @state() private _params?: MediaPlayerBrowseDialogParams;

  public showDialog(params: MediaPlayerBrowseDialogParams): void {
    this._params = params;
    this._entityId = this._params.entityId;
    this._mediaContentId = this._params.mediaContentId;
    this._mediaContentType = this._params.mediaContentType;
    this._action = this._params.action || "play";
  }

  public closeDialog() {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }

    return html`
      <op-dialog
        open
        scrimClickAction
        escapeKeyAction
        hideActions
        flexContent
        @closed=${this.closeDialog}
      >
        <op-media-player-browse
          dialog
          .opp=${this.opp}
          .entityId=${this._entityId}
          .action=${this._action!}
          .mediaContentId=${this._mediaContentId}
          .mediaContentType=${this._mediaContentType}
          @close-dialog=${this.closeDialog}
          @media-picked=${this._mediaPicked}
        ></op-media-player-browse>
      </op-dialog>
    `;
  }

  private _mediaPicked(ev: OPPDomEvent<MediaPickedEvent>): void {
    this._params!.mediaPickedCallback(ev.detail);
    if (this._action !== "play") {
      this.closeDialog();
    }
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        op-dialog {
          --dialog-z-index: 8;
          --dialog-content-padding: 0;
        }

        op-media-player-browse {
          --media-browser-max-height: 100vh;
        }

        @media (min-width: 800px) {
          op-dialog {
            --mdc-dialog-max-width: 800px;
            --dialog-surface-position: fixed;
            --dialog-surface-top: 40px;
            --mdc-dialog-max-height: calc(100vh - 72px);
          }
          op-media-player-browse {
            position: initial;
            --media-browser-max-height: 100vh - 72px;
            width: 700px;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-media-player-browse": DialogMediaPlayerBrowse;
  }
}
