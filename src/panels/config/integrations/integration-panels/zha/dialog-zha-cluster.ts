import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { OPPDomEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/op-code-editor";
import { createCloseHeading } from "../../../../../components/op-dialog";
import {
  Cluster,
  fetchBindableDevices,
  fetchGroups,
  ZHADevice,
  ZHAGroup,
} from "../../../../../data/zha";
import { haStyleDialog } from "../../../../../resources/styles";
import { OpenPeerPower } from "../../../../../types";
import { sortZHADevices, sortZHAGroups } from "./functions";
import { ZHADeviceZigbeeInfoDialogParams } from "./show-dialog-zop-device-zigbee-info";
import { ZHAClusterSelectedParams } from "./types";
import "./zop-cluster-attributes";
import "./zop-cluster-commands";
import "./zop-clusters";
import "./zop-device-binding";
import "./zop-group-binding";

@customElement("dialog-zop-cluster")
class DialogZHACluster extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _device?: ZHADevice;

  @internalProperty() private _selectedCluster?: Cluster;

  @internalProperty() private _bindableDevices: ZHADevice[] = [];

  @internalProperty() private _groups: ZHAGroup[] = [];

  public async showDialog(
    params: ZHADeviceZigbeeInfoDialogParams
  ): Promise<void> {
    this._device = params.device;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (changedProperties.has("_device")) {
      this._fetchData();
    }
  }

  protected render(): TemplateResult {
    if (!this._device) {
      return html``;
    }

    return html`
      <op-dialog
        open
        hideActions
        @closing="${this._close}"
        .heading=${createCloseHeading(
          this.opp,
          this.opp.localize("ui.panel.config.zha.clusters.header")
        )}
      >
        <zop-clusters
          .opp=${this.opp}
          .selectedDevice="${this._device}"
          @zop-cluster-selected="${this._onClusterSelected}"
        ></zop-clusters>
        ${this._selectedCluster
          ? html`
              <zop-cluster-attributes
                .opp=${this.opp}
                .selectedNode="${this._device}"
                .selectedCluster="${this._selectedCluster}"
              ></zop-cluster-attributes>
              <zop-cluster-commands
                .opp=${this.opp}
                .selectedNode="${this._device}"
                .selectedCluster="${this._selectedCluster}"
              ></zop-cluster-commands>
            `
          : ""}
        ${this._bindableDevices.length > 0
          ? html`
              <zop-device-binding-control
                .opp=${this.opp}
                .selectedDevice="${this._device}"
                .bindableDevices="${this._bindableDevices}"
              ></zop-device-binding-control>
            `
          : ""}
        ${this._device && this._groups.length > 0
          ? html`
              <zop-group-binding-control
                .opp=${this.opp}
                .selectedDevice="${this._device}"
                .groups="${this._groups}"
              ></zop-group-binding-control>
            `
          : ""}
      </op-dialog>
    `;
  }

  private _onClusterSelected(
    selectedClusterEvent: OPPDomEvent<ZHAClusterSelectedParams>
  ): void {
    this._selectedCluster = selectedClusterEvent.detail.cluster;
  }

  private _close(): void {
    this._device = undefined;
  }

  private async _fetchData(): Promise<void> {
    if (this._device && this.opp) {
      this._bindableDevices =
        this._device && this._device.device_type !== "Coordinator"
          ? (await fetchBindableDevices(this.opp, this._device.ieee)).sort(
              sortZHADevices
            )
          : [];
      this._groups = (await fetchGroups(this.opp!)).sort(sortZHAGroups);
    }
  }

  static get styles(): CSSResult {
    return haStyleDialog;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-zop-cluster": DialogZHACluster;
  }
}
