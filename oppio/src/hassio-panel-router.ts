import { customElement, property } from "lit-element";
import { Supervisor } from "../../src/data/supervisor/supervisor";
import {
  OppRouterPage,
  RouterOptions,
} from "../../src/layouts/opp-router-page";
import { OpenPeerPower, Route } from "../../src/types";
import "./addon-store/oppio-addon-store";
// Don't codesplit it, that way the dashboard always loads fast.
import "./dashboard/oppio-dashboard";
// Don't codesplit the others, because it breaks the UI when pushed to a Pi
import "./snapshots/oppio-snapshots";
import "./system/oppio-system";

@customElement("oppio-panel-router")
class OppioPanelRouter extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  protected routerOptions: RouterOptions = {
    routes: {
      dashboard: {
        tag: "oppio-dashboard",
      },
      store: {
        tag: "oppio-addon-store",
      },
      snapshots: {
        tag: "oppio-snapshots",
      },
      system: {
        tag: "oppio-system",
      },
    },
  };

  protected updatePageEl(el) {
    el.opp = this.opp;
    el.supervisor = this.supervisor;
    el.route = this.route;
    el.narrow = this.narrow;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-panel-router": OppioPanelRouter;
  }
}
