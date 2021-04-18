import { customElement, property } from "lit-element";
import { OppioAddonDetails } from "../../../src/data/oppio/addon";
import { Supervisor } from "../../../src/data/supervisor/supervisor";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../src/layouts/opp-router-page";
import { OpenPeerPower } from "../../../src/types";
import "./config/oppio-addon-config-tab";
import "./documentation/oppio-addon-documentation-tab";
// Don't codesplit the others, because it breaks the UI when pushed to a Pi
import "./info/oppio-addon-info-tab";
import "./log/oppio-addon-log-tab";

@customElement("oppio-addon-router")
class OppioAddonRouter extends OppRouterPage {
  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon!: OppioAddonDetails;

  protected routerOptions: RouterOptions = {
    defaultPage: "info",
    showLoading: true,
    routes: {
      info: {
        tag: "oppio-addon-info-tab",
      },
      documentation: {
        tag: "oppio-addon-documentation-tab",
      },
      config: {
        tag: "oppio-addon-config-tab",
      },
      logs: {
        tag: "oppio-addon-log-tab",
      },
    },
  };

  protected updatePageEl(el) {
    el.route = this.routeTail;
    el.opp = this.opp;
    el.supervisor = this.supervisor;
    el.addon = this.addon;
    el.narrow = this.narrow;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-router": OppioAddonRouter;
  }
}
