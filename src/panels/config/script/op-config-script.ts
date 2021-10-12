import { OppEntities } from "openpeerpower-js-websocket";
import { customElement, property, PropertyValues } from "lit-element";
import memoizeOne from "memoize-one";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { debounce } from "../../../common/util/debounce";
import { ScriptEntity } from "../../../data/script";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";
import "./op-script-editor";
import "./op-script-picker";

const equal = (a: ScriptEntity[], b: ScriptEntity[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((enityA, index) => enityA === b[index]);
};

@customElement("ha-config-script")
class HaConfigScript extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public scripts: ScriptEntity[] = [];

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "op-script-picker",
        cache: true,
      },
      edit: {
        tag: "op-script-editor",
      },
    },
  };

  private _debouncedUpdateScripts = debounce((pageEl) => {
    const newScript = this._getScripts(this.opp.states);
    if (!equal(newScript, pageEl.scripts)) {
      pageEl.scripts = newScript;
    }
  }, 10);

  private _getScripts = memoizeOne((states: OppEntities): ScriptEntity[] => {
    return Object.values(states).filter(
      (entity) => computeStateDomain(entity) === "script"
    ) as ScriptEntity[];
  });

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
      if (!pageEl.scripts || !changedProps) {
        pageEl.scripts = this._getScripts(this.opp.states);
      } else if (changedProps.has("opp")) {
        this._debouncedUpdateScripts(pageEl);
      }
    }

    if (
      (!changedProps || changedProps.has("route")) &&
      this._currentPage === "edit"
    ) {
      pageEl.creatingNew = undefined;
      const scriptEntityId = this.routeTail.path.substr(1);
      pageEl.scriptEntityId = scriptEntityId === "new" ? null : scriptEntityId;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-script": HaConfigScript;
  }
}
