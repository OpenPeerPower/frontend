import { UnsubscribeFunc } from "openpeerpower-js-websocket";
import { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators";
import { compare } from "../../../common/string/compare";
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
import "./op-config-area-page";
import "./op-config-areas-dashboard";

@customElement("op-config-areas")
class HaConfigAreas extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "op-config-areas-dashboard",
        cache: true,
      },
      area: {
        tag: "op-config-area-page",
      },
    },
  };

  @state() private _configEntries: ConfigEntry[] = [];

  @state()
  private _deviceRegistryEntries: DeviceRegistryEntry[] = [];

  @state()
  private _entityRegistryEntries: EntityRegistryEntry[] = [];

  @state() private _areas: AreaRegistryEntry[] = [];

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

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (!this._unsubs && changedProps.has("opp")) {
      this._loadData();
    }
  }

  protected updatePageEl(pageEl) {
    pageEl.opp = this.opp;

    if (this._currentPage === "area") {
      pageEl.areaId = this.routeTail.path.substr(1);
    }

    pageEl.entries = this._configEntries;
    pageEl.devices = this._deviceRegistryEntries;
    pageEl.entities = this._entityRegistryEntries;
    pageEl.areas = this._areas;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.showAdvanced = this.showAdvanced;
    pageEl.route = this.routeTail;
  }

  private _loadData() {
    getConfigEntries(this.opp).then((configEntries) => {
      this._configEntries = configEntries.sort((conf1, conf2) =>
        compare(conf1.title, conf2.title)
      );
    });
    if (this._unsubs) {
      return;
    }
    this._unsubs = [
      subscribeAreaRegistry(this.opp.connection, (areas) => {
        this._areas = areas;
      }),
      subscribeDeviceRegistry(this.opp.connection, (entries) => {
        this._deviceRegistryEntries = entries;
      }),
      subscribeEntityRegistry(this.opp.connection, (entries) => {
        this._entityRegistryEntries = entries;
      }),
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-config-areas": HaConfigAreas;
  }
}
