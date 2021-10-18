import "@material/mwc-button";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../components/dialog/op-paper-dialog";
import "../../components/op-circular-progress";
import LocalizeMixin from "../../mixins/localize-mixin";
import "../../styles/polymer-op-style-dialog";

/*
 * @appliesMixin LocalizeMixin
 */
class HaDialogShowAudioMessage extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="op-style-dialog">
        .error {
          color: red;
        }
        @media all and (max-width: 500px) {
          op-paper-dialog {
            margin: 0;
            width: 100%;
            max-height: calc(100% - var(--header-height));

            position: fixed !important;
            bottom: 0px;
            left: 0px;
            right: 0px;
            overflow: scroll;
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
          }
        }

        op-paper-dialog {
          border-radius: 2px;
        }
        op-paper-dialog p {
          color: var(--secondary-text-color);
        }

        .icon {
          float: right;
        }
      </style>
      <op-paper-dialog
        id="mp3dialog"
        with-backdrop
        opened="{{_opened}}"
        on-opened-changed="_openedChanged"
      >
        <h2>
          [[localize('ui.panel.mailbox.playback_title')]]
          <div class="icon">
            <template is="dom-if" if="[[_loading]]">
              <op-circular-progress active></op-circular-progress>
            </template>
            <op-icon-button
              id="delicon"
              on-click="openDeleteDialog"
              icon="opp:delete"
            ></op-icon-button>
          </div>
        </h2>
        <div id="transcribe"></div>
        <div>
          <template is="dom-if" if="[[_errorMsg]]">
            <div class="error">[[_errorMsg]]</div>
          </template>
          <audio id="mp3" preload="none" controls>
            <source id="mp3src" src="" type="audio/mpeg" />
          </audio>
        </div>
      </op-paper-dialog>
    `;
  }

  static get properties() {
    return {
      opp: Object,

      _currentMessage: Object,

      // Error message when can't talk to server etc
      _errorMsg: String,

      _loading: {
        type: Boolean,
        value: false,
      },

      _opened: {
        type: Boolean,
        value: false,
      },
    };
  }

  showDialog({ opp, message }) {
    this.opp = opp;
    this._errorMsg = null;
    this._currentMessage = message;
    this._opened = true;
    this.$.transcribe.innerText = message.message;
    const platform = message.platform;
    const mp3 = this.$.mp3;
    if (platform.has_media) {
      mp3.style.display = "";
      this._showLoading(true);
      mp3.src = null;
      const url = `/api/mailbox/media/${platform.name}/${message.sha}`;
      this.opp
        .fetchWithAuth(url)
        .then((response) => {
          if (response.ok) {
            return response.blob();
          }
          return Promise.reject({
            status: response.status,
            statusText: response.statusText,
          });
        })
        .then((blob) => {
          this._showLoading(false);
          mp3.src = window.URL.createObjectURL(blob);
          mp3.play();
        })
        .catch((err) => {
          this._showLoading(false);
          this._errorMsg = `Error loading audio: ${err.statusText}`;
        });
    } else {
      mp3.style.display = "none";
      this._showLoading(false);
    }
  }

  openDeleteDialog() {
    if (confirm(this.localize("ui.panel.mailbox.delete_prompt"))) {
      this.deleteSelected();
    }
  }

  deleteSelected() {
    const msg = this._currentMessage;
    this.opp.callApi(
      "DELETE",
      `mailbox/delete/${msg.platform.name}/${msg.sha}`
    );
    this._dialogDone();
  }

  _dialogDone() {
    this.$.mp3.pause();
    this.setProperties({
      _currentMessage: null,
      _errorMsg: null,
      _loading: false,
      _opened: false,
    });
  }

  _openedChanged(ev) {
    // Closed dialog by clicking on the overlay
    // Check against dialogClosedCallback to make sure we didn't change
    // programmatically
    if (!ev.detail.value) {
      this._dialogDone();
    }
  }

  _showLoading(displayed) {
    const delicon = this.$.delicon;
    if (displayed) {
      this._loading = true;
      delicon.style.display = "none";
    } else {
      const platform = this._currentMessage.platform;
      this._loading = false;
      delicon.style.display = platform.can_delete ? "" : "none";
    }
  }
}
customElements.define("op-dialog-show-audio-message", HaDialogShowAudioMessage);
