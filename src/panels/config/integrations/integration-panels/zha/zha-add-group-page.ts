import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  query,
} from "lit-element";
import type { OPPDomEvent } from "../../../../../common/dom/fire_event";
import { navigate } from "../../../../../common/navigate";
import type { SelectionChangedEvent } from "../../../../../components/data-table/ha-data-table";
import "../../../../../components/ha-circular-progress";
import {
  addGroup,
  fetchGroupableDevices,
  ZHADeviceEndpoint,
  ZHAGroup,
} from "../../../../../data/zha";
import "../../../../../layouts/opp-error-screen";
import "../../../../../layouts/opp-subpage";
import type { PolymerChangedEvent } from "../../../../../polymer-types";
import type { OpenPeerPower } from "../../../../../types";
import "../../../ha-config-section";
import "./zha-device-endpoint-data-table";
import type { ZHADeviceEndpointDataTable } from "./zha-device-endpoint-data-table";

@customElement("zha-add-group-page")
export class ZHAAddGroupPage extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Array }) public deviceEndpoints: ZHADeviceEndpoint[] = [];

  @internalProperty() private _processingAdd = false;

  @internalProperty() private _groupName = "";

  @query("zha-device-endpoint-data-table", true)
  private _zhaDevicesDataTable!: ZHADeviceEndpointDataTable;

  private _firstUpdatedCalled = false;

  private _selectedDevicesToAdd: string[] = [];

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.opp && this._firstUpdatedCalled) {
      this._fetchData();
    }
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.opp) {
      this._fetchData();
    }
    this._firstUpdatedCalled = true;
  }

  protected render() {
    return html`
      <opp-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .header=${this.opp.localize("ui.panel.config.zha.groups.create_group")}
      >
        <ha-config-section .isWide=${!this.narrow}>
          <p slot="introduction">
            ${this.opp.localize(
              "ui.panel.config.zha.groups.create_group_details"
            )}
          </p>
          <paper-input
            type="string"
            .value="${this._groupName}"
            @value-changed=${this._handleNameChange}
            placeholder="${this.opp!.localize(
              "ui.panel.config.zha.groups.group_name_placeholder"
            )}"
          ></paper-input>

          <div class="header">
            ${this.opp.localize("ui.panel.config.zha.groups.add_members")}
          </div>

          <zha-device-endpoint-data-table
            .opp=${this.opp}
            .deviceEndpoints=${this.deviceEndpoints}
            .narrow=${this.narrow}
            selectable
            @selection-changed=${this._handleAddSelectionChanged}
          >
          </zha-device-endpoint-data-table>

          <div class="paper-dialog-buttons">
            <mwc-button
              .disabled="${!this._groupName ||
              this._groupName === "" ||
              this._processingAdd}"
              @click="${this._createGroup}"
              class="button"
            >
              ${this._processingAdd
                ? html`<ha-circular-progress
                    active
                    size="small"
                    .title=${this.opp!.localize(
                      "ui.panel.config.zha.groups.creating_group"
                    )}
                  ></ha-circular-progress>`
                : ""}
              ${this.opp!.localize(
                "ui.panel.config.zha.groups.create"
              )}</mwc-button
            >
          </div>
        </ha-config-section>
      </opp-subpage>
    `;
  }

  private async _fetchData() {
    this.deviceEndpoints = await fetchGroupableDevices(this.opp!);
  }

  private _handleAddSelectionChanged(
    ev: OPPDomEvent<SelectionChangedEvent>
  ): void {
    this._selectedDevicesToAdd = ev.detail.value;
  }

  private async _createGroup(): Promise<void> {
    this._processingAdd = true;
    const members = this._selectedDevicesToAdd.map((member) => {
      const memberParts = member.split("_");
      return { ieee: memberParts[0], endpoint_id: memberParts[1] };
    });
    const group: ZHAGroup = await addGroup(this.opp, this._groupName, members);
    this._selectedDevicesToAdd = [];
    this._processingAdd = false;
    this._groupName = "";
    this._zhaDevicesDataTable.clearSelection();
    navigate(this, `/config/zha/group/${group.group_id}`, true);
  }

  private _handleNameChange(ev: PolymerChangedEvent<string>) {
    const target = ev.currentTarget as PaperInputElement;
    this._groupName = target.value || "";
  }

  static get styles(): CSSResult[] {
    return [
      css`
        .header {
          font-family: var(--paper-font-display1_-_font-family);
          -webkit-font-smoothing: var(
            --paper-font-display1_-_-webkit-font-smoothing
          );
          font-size: var(--paper-font-display1_-_font-size);
          font-weight: var(--paper-font-display1_-_font-weight);
          letter-spacing: var(--paper-font-display1_-_letter-spacing);
          line-height: var(--paper-font-display1_-_line-height);
          opacity: var(--dark-primary-opacity);
        }

        .button {
          float: right;
        }

        ha-config-section *:last-child {
          padding-bottom: 24px;
        }
        .paper-dialog-buttons {
          align-items: flex-end;
          padding: 8px;
        }
        .paper-dialog-buttons .warning {
          --mdc-theme-primary: var(--error-color);
        }
      `,
    ];
  }
}
