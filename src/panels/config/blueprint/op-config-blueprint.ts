import { customElement, property, PropertyValues } from "lit-element";
import { Blueprints, fetchBlueprints } from "../../../data/blueprint";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";
import "./op-blueprint-overview";

declare global {
  // for fire event
  interface OPPDomEvents {
    "reload-blueprints": undefined;
  }
}

@customElement("ha-config-blueprint")
class HaConfigBlueprint extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public blueprints: Blueprints = {};

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "op-blueprint-overview",
        cache: true,
      },
      edit: {
        tag: "op-blueprint-editor",
      },
    },
  };

  private async _getBlueprints() {
    this.blueprints = await fetchBlueprints(this.opp, "automation");
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.addEventListener("reload-blueprints", () => {
      this._getBlueprints();
    });
    this._getBlueprints();
  }

  protected updatePageEl(pageEl, changedProps: PropertyValues) {
    pageEl.opp = this.opp;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.route = this.routeTail;
    pageEl.showAdvanced = this.showAdvanced;
    pageEl.blueprints = this.blueprints;

    if (
      (!changedProps || changedProps.has("route")) &&
      this._currentPage === "edit"
    ) {
      const blueprintId = this.routeTail.path.substr(1);
      pageEl.blueprintId = blueprintId === "new" ? null : blueprintId;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-blueprint": HaConfigBlueprint;
  }
}
