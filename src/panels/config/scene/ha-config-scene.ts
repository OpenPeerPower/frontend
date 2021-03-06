import { OppEntities } from "openpeerpower-js-websocket";
import { customElement, property, PropertyValues } from "lit-element";
import memoizeOne from "memoize-one";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { debounce } from "../../../common/util/debounce";
import { SceneEntity } from "../../../data/scene";
import {
  OppRouterPage,
  RouterOptions,
} from "../../../layouts/opp-router-page";
import { OpenPeerPower } from "../../../types";
import "./ha-scene-dashboard";
import "./ha-scene-editor";

const equal = (a: SceneEntity[], b: SceneEntity[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((scene, index) => scene === b[index]);
};

@customElement("ha-config-scene")
class HaConfigScene extends OppRouterPage {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public showAdvanced!: boolean;

  @property() public scenes: SceneEntity[] = [];

  protected routerOptions: RouterOptions = {
    defaultPage: "dashboard",
    routes: {
      dashboard: {
        tag: "ha-scene-dashboard",
        cache: true,
      },
      edit: {
        tag: "ha-scene-editor",
      },
    },
  };

  private _debouncedUpdateScenes = debounce((pageEl) => {
    const newScenes = this._getScenes(this.opp.states);
    if (!equal(newScenes, pageEl.scenes)) {
      pageEl.scenes = newScenes;
    }
  }, 10);

  private _getScenes = memoizeOne((states: OppEntities): SceneEntity[] => {
    return Object.values(states).filter(
      (entity) => computeStateDomain(entity) === "scene"
    ) as SceneEntity[];
  });

  protected updatePageEl(pageEl, changedProps: PropertyValues) {
    pageEl.opp = this.opp;
    pageEl.narrow = this.narrow;
    pageEl.isWide = this.isWide;
    pageEl.route = this.routeTail;
    pageEl.showAdvanced = this.showAdvanced;

    if (this.opp) {
      if (!pageEl.scenes || !changedProps) {
        pageEl.scenes = this._getScenes(this.opp.states);
      } else if (changedProps.has("opp")) {
        this._debouncedUpdateScenes(pageEl);
      }
    }

    if (
      (!changedProps || changedProps.has("route")) &&
      this._currentPage === "edit"
    ) {
      pageEl.creatingNew = undefined;
      const sceneId = this.routeTail.path.substr(1);
      pageEl.sceneId = sceneId === "new" ? null : sceneId;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-scene": HaConfigScene;
  }
}
