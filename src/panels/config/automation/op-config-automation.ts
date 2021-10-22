import { OppEntities } from "openpeerpower-js-websocket";
import { PropertyValues } from "lit";
import { customElement, property } from "lit/decorators";
import memoizeOne from "memoize-one";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { debounce } from "../../../common/util/debounce";
import { AutomationEntity } from "../../../data/automation";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";
import "./op-automation-editor";
import "./op-automation-picker";

const equal = (a: AutomationEntity[], b: AutomationEntity[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((automation, index) => automation === b[index]);
};

@customElement("op-config-automation")
class HaConfigAutomation extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public automations: AutomationEntity[] = [];

  private _debouncedUpdateAutomations = debounce((pageEl) => {
    const newAutomations = this._getAutomations(this.opp.states);
    if (!equal(newAutomations, pageEl.automations)) {
      pageEl.automations = newAutomations;
    }
  }, 10);

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "op-automation-picker",
        cache: true,
      },
      edit: {
        tag: "op-automation-editor",
      },
      trace: {
        tag: "op-automation-trace",
        load: () => import("./op-automation-trace"),
      },
    },
  };

  private _getAutomations = memoizeOne(
    (states: OppEntities): AutomationEntity[] =>
      Object.values(states).filter(
        (entity) => computeStateDomain(entity) === "automation"
      ) as AutomationEntity[]
  );

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this.opp.loadBackendTranslation("device_automation");
  }

  protected updatePageEl(pageEl, changedProps: PropertyValues) {
    pageEl.opp = this.opp;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.route = this.routeTail;
    pageEl.showAdvanced = this.showAdvanced;

    if (this.opp) {
      if (!pageEl.automations || !changedProps) {
        pageEl.automations = this._getAutomations(this.opp.states);
      } else if (changedProps.has("opp")) {
        this._debouncedUpdateAutomations(pageEl);
      }
    }

    if (
      (!changedProps || changedProps.has("route")) &&
      this._currentPage !== "dashboard"
    ) {
      const automationId = this.routeTail.path.substr(1);
      pageEl.automationId = automationId === "new" ? null : automationId;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-config-automation": HaConfigAutomation;
  }
}
