import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  customElement,
  internalProperty,
  property,
  PropertyValues,
} from "lit-element";
import {
  AreaRegistryEntry,
  subscribeAreaRegistry,
} from "../../../data/area_registry";
import { ConfigEntry, getConfigEntries } from "../../../data/config_entries";
import {
  DeviceRegistryEntry,
  subscribeDeviceRegistry,
} from "../../../data/device_registry";
import {
  EntityRegistryEntry,
  subscribeEntityRegistry,
} from "../../../data/entity_registry";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";
import "./ha-config-device-page";
import "./ha-config-devices-dashboard";

@customElement("ha-config-devices")
class HaConfigDevices extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "ha-config-devices-dashboard",
        cache: true,
      },
      device: {
        tag: "ha-config-device-page",
      },
    },
  };

  @internalProperty() private _configEntries: ConfigEntry[] = [];

  @internalProperty()
  private _entityRegistryEntries: EntityRegistryEntry[] = [];

  @internalProperty()
  private _deviceRegistryEntries: DeviceRegistryEntry[] = [];

  @internalProperty() private _areas: AreaRegistryEntry[] = [];

  private _unsubs?: UnsubscribeFunc[];

  public connectedCallback() {
    super.connectedCallback();

    if (!this.opp) {
      return;
    }
    this._loadData();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubs) {
      while (this._unsubs.length) {
        this._unsubs.pop()!();
      }
      this._unsubs = undefined;
    }
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.addEventListener("opp-reload-entries", () => {
      this._loadData();
    });
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (!this._unsubs && changedProps.has("opp")) {
      this._loadData();
    }
  }

  protected updatePageEl(pageEl) {
    pageEl.opp = this.opp;

    if (this._currentPage === "device") {
      pageEl.deviceId = this.routeTail.path.substr(1);
    }

    pageEl.entities = this._entityRegistryEntries;
    pageEl.entries = this._configEntries;
    pageEl.devices = this._deviceRegistryEntries;
    pageEl.areas = this._areas;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.showAdvanced = this.showAdvanced;
    pageEl.route = this.routeTail;
  }

  private _loadData() {
    getConfigEntries(this.opp).then((configEntries) => {
      this._configEntries = configEntries;
    });
    if (this._unsubs) {
      return;
    }
    this._unsubs = [
      subscribeAreaRegistry(this.opp.connection, (areas) => {
        this._areas = areas;
      }),
      subscribeEntityRegistry(this.opp.connection, (entries) => {
        this._entityRegistryEntries = entries;
      }),
      subscribeDeviceRegistry(this.opp.connection, (entries) => {
        this._deviceRegistryEntries = entries;
      }),
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-devices": HaConfigDevices;
  }
}
