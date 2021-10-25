import {
  mdiAccount,
  mdiBadgeAccountHorizontal,
  mdiDevices,
  mdiHomeAssistant,
  mdiInformation,
  mdiMapMarkerRadius,
  mdiMathLog,
  mdiNfcVariant,
  mdiPalette,
  mdiPaletteSwatch,
  mdiPencil,
  mdiPuzzle,
  mdiRobot,
  mdiScriptText,
  mdiServer,
  mdiShape,
  mdiSofa,
  mdiTools,
  mdiViewDashboard,
} from "@mdi/js";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import { PolymerElement } from "@polymer/polymer";
import {
  customElement,
  internalProperty,
  property,
  PropertyValues,
} from "lit-element";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import { listenMediaQuery } from "../../common/dom/media_query";
import { CloudStatus, fetchCloudStatus } from "../../data/cloud";
import "../../layouts/opp-loading-screen";
import { OppRouterPage, RouterOptions } from "../../layouts/opp-router-page";
import { PageNavigation } from "../../layouts/opp-tabs-subpage";
import { OpenPeerPower, Route } from "../../types";

declare global {
  // for fire event
  interface OPPDomEvents {
    "op-refresh-cloud-status": undefined;
  }
}

export const configSections: { [name: string]: PageNavigation[] } = {
  integrations: [
    {
      component: "integrations",
      path: "/config/integrations",
      translationKey: "ui.panel.config.integrations.caption",
      iconPath: mdiPuzzle,
      core: true,
    },
    {
      component: "devices",
      path: "/config/devices",
      translationKey: "ui.panel.config.devices.caption",
      iconPath: mdiDevices,
      core: true,
    },
    {
      component: "entities",
      path: "/config/entities",
      translationKey: "ui.panel.config.entities.caption",
      iconPath: mdiShape,
      core: true,
    },
    {
      component: "areas",
      path: "/config/areas",
      translationKey: "ui.panel.config.areas.caption",
      iconPath: mdiSofa,
      core: true,
    },
  ],
  automation: [
    {
      component: "blueprint",
      path: "/config/blueprint",
      translationKey: "ui.panel.config.blueprint.caption",
      iconPath: mdiPaletteSwatch,
    },
    {
      component: "automation",
      path: "/config/automation",
      translationKey: "ui.panel.config.automation.caption",
      iconPath: mdiRobot,
    },
    {
      component: "scene",
      path: "/config/scene",
      translationKey: "ui.panel.config.scene.caption",
      iconPath: mdiPalette,
    },
    {
      component: "script",
      path: "/config/script",
      translationKey: "ui.panel.config.script.caption",
      iconPath: mdiScriptText,
    },
  ],
  helpers: [
    {
      component: "helpers",
      path: "/config/helpers",
      translationKey: "ui.panel.config.helpers.caption",
      iconPath: mdiTools,
      core: true,
    },
  ],
  experimental: [
    {
      component: "tag",
      path: "/config/tags",
      translationKey: "ui.panel.config.tag.caption",
      iconPath: mdiNfcVariant,
    },
  ],
  lovelace: [
    {
      component: "lovelace",
      path: "/config/lovelace/dashboards",
      translationKey: "ui.panel.config.lovelace.caption",
      iconPath: mdiViewDashboard,
    },
  ],
  persons: [
    {
      component: "person",
      path: "/config/person",
      translationKey: "ui.panel.config.person.caption",
      iconPath: mdiAccount,
    },
    {
      component: "zone",
      path: "/config/zone",
      translationKey: "ui.panel.config.zone.caption",
      iconPath: mdiMapMarkerRadius,
    },
    {
      component: "users",
      path: "/config/users",
      translationKey: "ui.panel.config.users.caption",
      iconPath: mdiBadgeAccountHorizontal,
      core: true,
      advancedOnly: true,
    },
  ],
  general: [
    {
      component: "core",
      path: "/config/core",
      translationKey: "ui.panel.config.core.caption",
      iconPath: mdiHomeAssistant,
      core: true,
    },
    {
      component: "server_control",
      path: "/config/server_control",
      translationKey: "ui.panel.config.server_control.caption",
      iconPath: mdiServer,
      core: true,
    },
    {
      component: "logs",
      path: "/config/logs",
      translationKey: "ui.panel.config.logs.caption",
      iconPath: mdiMathLog,
      core: true,
    },
    {
      component: "info",
      path: "/config/info",
      translationKey: "ui.panel.config.info.caption",
      iconPath: mdiInformation,
      core: true,
    },
  ],
  advanced: [
    {
      component: "customize",
      path: "/config/customize",
      translationKey: "ui.panel.config.customize.caption",
      iconPath: mdiPencil,
      core: true,
      advancedOnly: true,
    },
  ],
};

@customElement("op-panel-config")
class HaPanelConfig extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      areas: {
        tag: "op-config-areas",
        load: () => import("./areas/op-config-areas"),
      },
      automation: {
        tag: "op-config-automation",
        load: () => import("./automation/op-config-automation"),
      },
      blueprint: {
        tag: "op-config-blueprint",
        load: () => import("./blueprint/op-config-blueprint"),
      },
      tags: {
        tag: "op-config-tags",
        load: () => import("./tags/op-config-tags"),
      },
      cloud: {
        tag: "op-config-cloud",
        load: () => import("./cloud/op-config-cloud"),
      },
      core: {
        tag: "op-config-core",
        load: () => import("./core/op-config-core"),
      },
      devices: {
        tag: "op-config-devices",
        load: () => import("./devices/op-config-devices"),
      },
      server_control: {
        tag: "op-config-server-control",
        load: () => import("./server_control/op-config-server-control"),
      },
      logs: {
        tag: "op-config-logs",
        load: () => import("./logs/op-config-logs"),
      },
      info: {
        tag: "op-config-info",
        load: () => import("./info/op-config-info"),
      },
      customize: {
        tag: "op-config-customize",
        load: () => import("./customize/op-config-customize"),
      },
      dashboard: {
        tag: "op-config-dashboard",
        load: () => import("./dashboard/op-config-dashboard"),
      },
      entities: {
        tag: "op-config-entities",
        load: () => import("./entities/op-config-entities"),
      },
      integrations: {
        tag: "op-config-integrations",
        load: () => import("./integrations/op-config-integrations"),
      },
      lovelace: {
        tag: "op-config-lovelace",
        load: () => import("./lovelace/op-config-lovelace"),
      },
      person: {
        tag: "op-config-person",
        load: () => import("./person/op-config-person"),
      },
      script: {
        tag: "op-config-script",
        load: () => import("./script/op-config-script"),
      },
      scene: {
        tag: "op-config-scene",
        load: () => import("./scene/op-config-scene"),
      },
      helpers: {
        tag: "op-config-helpers",
        load: () => import("./helpers/op-config-helpers"),
      },
      users: {
        tag: "op-config-users",
        load: () => import("./users/op-config-users"),
      },
      zone: {
        tag: "op-config-zone",
        load: () => import("./zone/op-config-zone"),
      },
      zha: {
        tag: "zha-config-dashboard-router",
        load: () =>
          import(
            "./integrations/integration-panels/zha/zha-config-dashboard-router"
          ),
      },
      zwave: {
        tag: "zwave-config-router",
        load: () =>
          import("./integrations/integration-panels/zwave/zwave-config-router"),
      },
      mqtt: {
        tag: "mqtt-config-panel",
        load: () =>
          import("./integrations/integration-panels/mqtt/mqtt-config-panel"),
      },
      ozw: {
        tag: "ozw-config-router",
        load: () =>
          import("./integrations/integration-panels/ozw/ozw-config-router"),
      },
      zwave_js: {
        tag: "zwave_js-config-router",
        load: () =>
          import(
            "./integrations/integration-panels/zwave_js/zwave_js-config-router"
          ),
      },
    },
  };

  @internalProperty() private _wideSidebar = false;

  @internalProperty() private _wide = false;

  @internalProperty() private _cloudStatus?: CloudStatus;

  private _listeners: Array<() => void> = [];

  public connectedCallback() {
    super.connectedCallback();
    this._listeners.push(
      listenMediaQuery("(min-width: 1040px)", (matches) => {
        this._wide = matches;
      })
    );
    this._listeners.push(
      listenMediaQuery("(min-width: 1296px)", (matches) => {
        this._wideSidebar = matches;
      })
    );
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    while (this._listeners.length) {
      this._listeners.pop()!();
    }
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this.opp.loadBackendTranslation("title");
    if (isComponentLoaded(this.opp, "cloud")) {
      this._updateCloudStatus();
    }
    this.addEventListener("op-refresh-cloud-status", () =>
      this._updateCloudStatus()
    );
    this.style.setProperty(
      "--app-header-background-color",
      "var(--sidebar-background-color)"
    );
    this.style.setProperty(
      "--app-header-text-color",
      "var(--sidebar-text-color)"
    );
    this.style.setProperty(
      "--app-header-border-bottom",
      "1px solid var(--divider-color)"
    );
  }

  protected updatePageEl(el) {
    const isWide =
      this.opp.dockedSidebar === "docked" ? this._wideSidebar : this._wide;

    if ("setProperties" in el) {
      // As long as we have Polymer panels
      (el as PolymerElement).setProperties({
        route: this.routeTail,
        opp: this.opp,
        showAdvanced: Boolean(this.opp.userData?.showAdvanced),
        isWide,
        narrow: this.narrow,
        cloudStatus: this._cloudStatus,
      });
    } else {
      el.route = this.routeTail;
      el.opp = this.opp;
      el.showAdvanced = Boolean(this.opp.userData?.showAdvanced);
      el.isWide = isWide;
      el.narrow = this.narrow;
      el.cloudStatus = this._cloudStatus;
    }
  }

  private async _updateCloudStatus() {
    this._cloudStatus = await fetchCloudStatus(this.opp);

    if (this._cloudStatus.cloud === "connecting") {
      setTimeout(() => this._updateCloudStatus(), 5000);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-panel-config": HaPanelConfig;
  }
}
