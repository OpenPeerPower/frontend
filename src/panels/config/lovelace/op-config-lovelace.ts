import { customElement, property } from "lit-element";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";

export const lovelaceTabs = [
  {
    component: "lovelace",
    path: "/config/lovelace/dashboards",
    translationKey: "ui.panel.config.lovelace.dashboards.caption",
    icon: "opp:view-dashboard",
  },
  {
    component: "lovelace",
    path: "/config/lovelace/resources",
    translationKey: "ui.panel.config.lovelace.resources.caption",
    icon: "opp:file-multiple",
    advancedOnly: true,
  },
];

@customElement("ha-config-lovelace")
class HaConfigLovelace extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboards",
    routes: {
      dashboards: {
        tag: "ha-config-lovelace-dashboards",
        load: () => import("./dashboards/ha-config-lovelace-dashboards"),
        cache: true,
      },
      resources: {
        tag: "ha-config-lovelace-resources",
        load: () => import("./resources/ha-config-lovelace-resources"),
      },
    },
  };

  protected updatePageEl(pageEl) {
    pageEl.opp = this.opp;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.route = this.routeTail;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-lovelace": HaConfigLovelace;
  }
}
