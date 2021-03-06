import { mdiNetwork, mdiServerNetwork } from "@mdi/js";
import { customElement, property } from "lit-element";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../../../layouts/opp-router-page";
import { PageNavigation } from "../../../../../layouts/opp-tabs-subpage";
import { OpenPeerPower } from "../../../../../types";
import { computeTail } from "./ozw-config-router";

export const ozwNetworkTabs = (instance: number): PageNavigation[] => {
  return [
    {
      translationKey: "ui.panel.config.ozw.navigation.network",
      path: `/config/ozw/network/${instance}/dashboard`,
      iconPath: mdiServerNetwork,
    },
    {
      translationKey: "ui.panel.config.ozw.navigation.nodes",
      path: `/config/ozw/network/${instance}/nodes`,
      iconPath: mdiNetwork,
    },
  ];
};

@customElement("ozw-network-router")
class OZWNetworkRouter extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public ozwInstance!: number;

  private _configEntry = new URLSearchParams(window.location.search).get(
    "config_entry"
  );

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    showLoading: true,
    routes: {
      dashboard: {
        tag: "ozw-network-dashboard",
        load: () => import("./ozw-network-dashboard"),
      },
      nodes: {
        tag: "ozw-network-nodes",
        load: () => import("./ozw-network-nodes"),
      },
      node: {
        tag: "ozw-node-router",
        load: () => import("./ozw-node-router"),
      },
    },
  };

  protected updatePageEl(el): void {
    el.route = computeTail(this.routeTail);
    el.opp = this.opp;
    el.isWide = this.isWide;
    el.narrow = this.narrow;
    el.configEntryId = this._configEntry;
    el.ozwInstance = this.ozwInstance;
    if (this._currentPage === "node") {
      el.nodeId = this.routeTail.path.split("/")[1];
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ozw-network-router": OZWNetworkRouter;
  }
}
