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
import { createCloseHeading } from "../../../../../components/op-dialog";
import { haStyleDialog } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import { ZHAReconfigureDeviceDialogParams } from "./show-dialog-zha-reconfigure-device";
import { IronAutogrowTextareaElement } from "@polymer/iron-autogrow-textarea";
import "@polymer/paper-input/paper-textarea";
import "../../../../../components/op-circular-progress";
import { LOG_OUTPUT, reconfigureNode } from "../../../../../data/zha";
import { fireEvent } from "../../../../../common/dom/fire_event";

@customElement("dialog-zha-reconfigure-device")
class DialogZHAReconfigureDevice extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _active = false;

  @internalProperty() private _formattedEvents = "";

  @internalProperty()
  private _params: ZHAReconfigureDeviceDialogParams | undefined = undefined;

  private _subscribed?: Promise<() => Promise<void>>;

  private _reconfigureDeviceTimeoutHandle: any = undefined;

  public async showDialog(
    params: ZHAReconfigureDeviceDialogParams
  ): Promise<void> {
    this._params = params;
    this._subscribe(params);
  }

  public closeDialog(): void {
    this._unsubscribe();
    this._formattedEvents = "";
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
        hideActions
        @closing="${this.closeDialog}"
        .heading=${createCloseHeading(
          this.opp,
          this.opp.localize(`ui.dialogs.zha_reconfigure_device.heading`)
        )}
      >
        <div class="searching">
          ${this._active
            ? html`
                <h1>
                  ${this._params?.device.user_given_name ||
                  this._params?.device.name}
                </h1>
                <op-circular-progress
                  active
                  alt="Searching"
                ></op-circular-progress>
              `
            : ""}
        </div>
        <paper-textarea
          readonly
          max-rows="10"
          class="log"
          value="${this._formattedEvents}"
        >
        </paper-textarea>
      </op-dialog>
    `;
  }

  private _handleMessage(message: any): void {
    if (message.type === LOG_OUTPUT) {
      this._formattedEvents += message.log_entry.message + "\n";
      const paperTextArea = this.shadowRoot!.querySelector("paper-textarea");
      if (paperTextArea) {
        const textArea = (
          paperTextArea.inputElement as IronAutogrowTextareaElement
        ).textarea;
        textArea.scrollTop = textArea.scrollHeight;
      }
    }
  }

  private _unsubscribe(): void {
    this._active = false;
    if (this._reconfigureDeviceTimeoutHandle) {
      clearTimeout(this._reconfigureDeviceTimeoutHandle);
    }
    if (this._subscribed) {
      this._subscribed.then((unsub) => unsub());
      this._subscribed = undefined;
    }
  }

  private _subscribe(params: ZHAReconfigureDeviceDialogParams): void {
    if (!this.opp) {
      return;
    }
    this._active = true;
    this._subscribed = reconfigureNode(
      this.opp,
      params.device.ieee,
      this._handleMessage.bind(this)
    );
    this._reconfigureDeviceTimeoutHandle = setTimeout(
      () => this._unsubscribe(),
      60000
    );
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        op-circular-progress {
          padding: 20px;
        }
        .searching {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .log {
          padding: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-zha-reconfigure-device": DialogZHAReconfigureDevice;
  }
}
