import "@material/mwc-button";
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
import { OPPDomEvent } from "../../../../../common/dom/fire_event";
import { navigate } from "../../../../../common/navigate";
import { SelectionChangedEvent } from "../../../../../components/data-table/ha-data-table";
import "../../../../../components/ha-circular-progress";
import "../../../../../components/op-icon-button";
import {
  addMembersToGroup,
  fetchGroup,
  fetchGroupableDevices,
  removeGroups,
  removeMembersFromGroup,
  ZHADeviceEndpoint,
  ZHAGroup,
} from "../../../../../data/zha";
import "../../../../../layouts/opp-error-screen";
import "../../../../../layouts/opp-subpage";
import { OpenPeerPower } from "../../../../../types";
import "../../../ha-config-section";
import { formatAsPaddedHex } from "./functions";
import "./zha-device-endpoint-data-table";
import type { ZHADeviceEndpointDataTable } from "./zha-device-endpoint-data-table";

@customElement("zha-group-page")
export class ZHAGroupPage extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public group?: ZHAGroup;

  @property({ type: Number }) public groupId!: number;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property({ type: Array }) public deviceEndpoints: ZHADeviceEndpoint[] = [];

  @internalProperty() private _processingAdd = false;

  @internalProperty() private _processingRemove = false;

  @internalProperty()
  private _filteredDeviceEndpoints: ZHADeviceEndpoint[] = [];

  @internalProperty() private _selectedDevicesToAdd: string[] = [];

  @internalProperty() private _selectedDevicesToRemove: string[] = [];

  @query("#addMembers", true)
  private _zhaAddMembersDataTable!: ZHADeviceEndpointDataTable;

  @query("#removeMembers")
  private _zhaRemoveMembersDataTable!: ZHADeviceEndpointDataTable;

  private _firstUpdatedCalled = false;

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.opp && this._firstUpdatedCalled) {
      this._fetchData();
    }
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._processingAdd = false;
    this._processingRemove = false;
    this._selectedDevicesToRemove = [];
    this._selectedDevicesToAdd = [];
    this.deviceEndpoints = [];
    this._filteredDeviceEndpoints = [];
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.opp) {
      this._fetchData();
    }
    this._firstUpdatedCalled = true;
  }

  protected render() {
    if (!this.group) {
      return html`
        <opp-error-screen
          .opp=${this.opp}
          .error=${this.opp.localize(
            "ui.panel.config.zha.groups.group_not_found"
          )}
        ></opp-error-screen>
      `;
    }

    return html`
      <opp-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .header=${this.group.name}
      >
        <op-icon-button
          slot="toolbar-icon"
          icon="opp:delete"
          @click=${this._deleteGroup}
        ></op-icon-button>
        <op-config-section .isWide=${this.isWide}>
          <div class="header">
            ${this.opp.localize("ui.panel.config.zha.groups.group_info")}
          </div>

          <p slot="introduction">
            ${this.opp.localize("ui.panel.config.zha.groups.group_details")}
          </p>

          <p><b>Name:</b> ${this.group.name}</p>
          <p><b>Group Id:</b> ${formatAsPaddedHex(this.group.group_id)}</p>

          <div class="header">
            ${this.opp.localize("ui.panel.config.zha.groups.members")}
          </div>
          <op-card>
            ${this.group.members.length
              ? this.group.members.map(
                  (member) =>
                    html`<a
                      href="/config/devices/device/${member.device
                        .device_reg_id}"
                    >
                      <paper-item
                        >${member.device.user_given_name ||
                        member.device.name}</paper-item
                      >
                    </a>`
                )
              : html` <paper-item> This group has no members </paper-item> `}
          </op-card>
          ${this.group.members.length
            ? html`
                <div class="header">
                  ${this.opp.localize(
                    "ui.panel.config.zha.groups.remove_members"
                  )}
                </div>

                <zha-device-endpoint-data-table
                  id="removeMembers"
                  .opp=${this.opp}
                  .deviceEndpoints=${this.group.members}
                  .narrow=${this.narrow}
                  selectable
                  @selection-changed=${this._handleRemoveSelectionChanged}
                >
                </zha-device-endpoint-data-table>

                <div class="paper-dialog-buttons">
                  <mwc-button
                    .disabled="${!this._selectedDevicesToRemove.length ||
                    this._processingRemove}"
                    @click="${this._removeMembersFromGroup}"
                    class="button"
                  >
                    <op-circular-progress
                      ?active="${this._processingRemove}"
                      alt=${this.opp.localize(
                        "ui.panel.config.zha.groups.removing_members"
                      )}
                    ></op-circular-progress>
                    ${this.opp!.localize(
                      "ui.panel.config.zha.groups.remove_members"
                    )}</mwc-button
                  >
                </div>
              `
            : html``}

          <div class="header">
            ${this.opp.localize("ui.panel.config.zha.groups.add_members")}
          </div>

          <zha-device-endpoint-data-table
            id="addMembers"
            .opp=${this.opp}
            .deviceEndpoints=${this._filteredDeviceEndpoints}
            .narrow=${this.narrow}
            selectable
            @selection-changed=${this._handleAddSelectionChanged}
          >
          </zha-device-endpoint-data-table>

          <div class="paper-dialog-buttons">
            <mwc-button
              .disabled="${!this._selectedDevicesToAdd.length ||
              this._processingAdd}"
              @click="${this._addMembersToGroup}"
              class="button"
            >
              ${this._processingAdd
                ? html`<op-circular-progress
                    active
                    size="small"
                    title="Saving"
                  ></op-circular-progress>`
                : ""}
              ${this.opp!.localize(
                "ui.panel.config.zha.groups.add_members"
              )}</mwc-button
            >
          </div>
        </op-config-section>
      </opp-subpage>
    `;
  }

  private async _fetchData() {
    if (this.groupId !== null && this.groupId !== undefined) {
      this.group = await fetchGroup(this.opp!, this.groupId);
    }
    this.deviceEndpoints = await fetchGroupableDevices(this.opp!);
    // filter the groupable devices so we only show devices that aren't already in the group
    this._filterDevices();
  }

  private _filterDevices() {
    // filter the groupable devices so we only show devices that aren't already in the group
    this._filteredDeviceEndpoints = this.deviceEndpoints.filter(
      (deviceEndpoint) => {
        return !this.group!.members.some(
          (member) =>
            member.device.ieee === deviceEndpoint.device.ieee &&
            member.endpoint_id === deviceEndpoint.endpoint_id
        );
      }
    );
  }

  private _handleAddSelectionChanged(
    ev: OPPDomEvent<SelectionChangedEvent>
  ): void {
    this._selectedDevicesToAdd = ev.detail.value;
  }

  private _handleRemoveSelectionChanged(
    ev: OPPDomEvent<SelectionChangedEvent>
  ): void {
    this._selectedDevicesToRemove = ev.detail.value;
  }

  private async _addMembersToGroup(): Promise<void> {
    this._processingAdd = true;
    const members = this._selectedDevicesToAdd.map((member) => {
      const memberParts = member.split("_");
      return { ieee: memberParts[0], endpoint_id: memberParts[1] };
    });
    this.group = await addMembersToGroup(this.opp, this.groupId, members);
    this._filterDevices();
    this._selectedDevicesToAdd = [];
    this._zhaAddMembersDataTable.clearSelection();
    this._processingAdd = false;
  }

  private async _removeMembersFromGroup(): Promise<void> {
    this._processingRemove = true;
    const members = this._selectedDevicesToRemove.map((member) => {
      const memberParts = member.split("_");
      return { ieee: memberParts[0], endpoint_id: memberParts[1] };
    });
    this.group = await removeMembersFromGroup(this.opp, this.groupId, members);
    this._filterDevices();
    this._selectedDevicesToRemove = [];
    this._zhaRemoveMembersDataTable.clearSelection();
    this._processingRemove = false;
  }

  private async _deleteGroup(): Promise<void> {
    await removeGroups(this.opp, [this.groupId]);
    navigate(this, `/config/zha/groups`, true);
  }

  static get styles(): CSSResult[] {
    return [
      css`
        opp-subpage {
          --app-header-text-color: var(--sidebar-icon-color);
        }
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

        a {
          color: var(--primary-color);
          text-decoration: none;
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
