import { mdiClose } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../src/common/dom/fire_event";
import "../../../../src/common/search/search-input";
import { compare } from "../../../../src/common/string/compare";
import "../../../../src/components/op-dialog";
import "../../../../src/components/op-expansion-panel";
import { OppioHardwareInfo } from "../../../../src/data/oppio/hardware";
import { dump } from "../../../../src/resources/js-yaml-dump";
import { haStyle, haStyleDialog } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { OppioHardwareDialogParams } from "./show-dialog-oppio-hardware";

const _filterDevices = memoizeOne(
  (showAdvanced: boolean, hardware: OppioHardwareInfo, filter: string) =>
    hardware.devices
      .filter(
        (device) =>
          (showAdvanced ||
            ["tty", "gpio", "input"].includes(device.subsystem)) &&
          (device.by_id?.toLowerCase().includes(filter) ||
            device.name.toLowerCase().includes(filter) ||
            device.dev_path.toLocaleLowerCase().includes(filter) ||
            JSON.stringify(device.attributes)
              .toLocaleLowerCase()
              .includes(filter))
      )
      .sort((a, b) => compare(a.name, b.name))
);

@customElement("dialog-oppio-hardware")
class OppioHardwareDialog extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @state() private _dialogParams?: OppioHardwareDialogParams;

  @state() private _filter?: string;

  public showDialog(params: OppioHardwareDialogParams) {
    this._dialogParams = params;
  }

  public closeDialog() {
    this._dialogParams = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._dialogParams) {
      return html``;
    }

    const devices = _filterDevices(
      this.opp.userData?.showAdvanced || false,
      this._dialogParams.hardware,
      (this._filter || "").toLowerCase()
    );

    return html`
      <op-dialog
        open
        scrimClickAction
        hideActions
        @closed=${this.closeDialog}
        .heading=${true}
      >
        <div class="header" slot="heading">
          <h2>
            ${this._dialogParams.supervisor.localize("dialog.hardware.title")}
          </h2>
          <mwc-icon-button dialogAction="close">
            <op-svg-icon .path=${mdiClose}></op-svg-icon>
          </mwc-icon-button>
          <search-input
            autofocus
            no-label-float
            .filter=${this._filter}
            @value-changed=${this._handleSearchChange}
            .label=${this._dialogParams.supervisor.localize(
              "dialog.hardware.search"
            )}
          >
          </search-input>
        </div>

        ${devices.map(
          (device) =>
            html`<op-expansion-panel
              .header=${device.name}
              .secondary=${device.by_id || undefined}
              outlined
            >
              <div class="device-property">
                <span>
                  ${this._dialogParams!.supervisor.localize(
                    "dialog.hardware.subsystem"
                  )}:
                </span>
                <span>${device.subsystem}</span>
              </div>
              <div class="device-property">
                <span>
                  ${this._dialogParams!.supervisor.localize(
                    "dialog.hardware.device_path"
                  )}:
                </span>
                <code>${device.dev_path}</code>
              </div>
              ${device.by_id
                ? html` <div class="device-property">
                    <span>
                      ${this._dialogParams!.supervisor.localize(
                        "dialog.hardware.id"
                      )}:
                    </span>
                    <code>${device.by_id}</code>
                  </div>`
                : ""}
              <div class="attributes">
                <span>
                  ${this._dialogParams!.supervisor.localize(
                    "dialog.hardware.attributes"
                  )}:
                </span>
                <pre>${dump(device.attributes, { indent: 2 })}</pre>
              </div>
            </op-expansion-panel>`
        )}
      </op-dialog>
    `;
  }

  private _handleSearchChange(ev: CustomEvent) {
    this._filter = ev.detail.value;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      haStyleDialog,
      css`
        mwc-icon-button {
          position: absolute;
          right: 16px;
          top: 10px;
          text-decoration: none;
          color: var(--primary-text-color);
        }
        h2 {
          margin: 18px 42px 0 18px;
          color: var(--primary-text-color);
        }

        op-expansion-panel {
          margin: 4px 0;
        }
        pre,
        code {
          background-color: var(--markdown-code-background-color, none);
          border-radius: 3px;
        }
        pre {
          padding: 16px;
          overflow: auto;
          line-height: 1.45;
          font-family: var(--code-font-family, monospace);
        }
        code {
          font-size: 85%;
          padding: 0.2em 0.4em;
        }
        search-input {
          margin: 0 16px;
          display: block;
        }
        .device-property {
          display: flex;
          justify-content: space-between;
        }
        .attributes {
          margin-top: 12px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-oppio-hardware": OppioHardwareDialog;
  }
}
