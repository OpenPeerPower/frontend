import { customElement, property } from "lit-element";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../../../types";
import { navigate } from "../../../../../common/navigate";
import { PageNavigation } from "../../../../../layouts/opp-tabs-subpage";

import { mdiServerNetwork } from "@mdi/js";

export const configTabs: PageNavigation[] = [
  {
    translationKey: "ui.panel.config.zwave_js.navigation.network",
    path: `/config/zwave_js/dashboard`,
    iconPath: mdiServerNetwork,
  },
];

@customElement("zwave_js-config-router")
class ZWaveJSConfigRouter extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  private _configEntry = new URLSearchParams(window.location.search).get(
    "config_entry"
  );

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    showLoading: true,
    routes: {
      dashboard: {
        tag: "zwave_js-config-dashboard",
        load: () => import("./zwave_js-config-dashboard"),
      },
      node_config: {
        tag: "zwave_js-node-config",
        load: () => import("./zwave_js-node-config"),
      },
    },
  };

  protected updatePageEl(el): void {
    el.route = this.routeTail;
    el.opp = this.opp;
    el.isWide = this.isWide;
    el.narrow = this.narrow;
    el.configEntryId = this._configEntry;

    const searchParams = new URLSearchParams(window.location.search);
    if (this._configEntry && !searchParams.has("config_entry")) {
      searchParams.append("config_entry", this._configEntry);
      navigate(
        this,
        `${this.routeTail.prefix}${
          this.routeTail.path
        }?${searchParams.toString()}`,
        true
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zwave_js-config-router": ZWaveJSConfigRouter;
  }
}
