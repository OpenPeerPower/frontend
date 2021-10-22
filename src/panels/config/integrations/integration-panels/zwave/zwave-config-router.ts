import { customElement, property } from "lit-element";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../../../types";
import { navigate } from "../../../../../common/navigate";

@customElement("zwave-config-router")
class ZWaveConfigRouter extends OppRouterPage {
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
        tag: "op-config-zwave",
        load: () =>
          import(/* webpackChunkName: "op-config-zwave" */ "./op-config-zwave"),
      },
      migration: {
        tag: "zwave-migration",
        load: () =>
          import(/* webpackChunkName: "zwave-migration" */ "./zwave-migration"),
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
    "zwave-config-router": ZWaveConfigRouter;
  }
}
