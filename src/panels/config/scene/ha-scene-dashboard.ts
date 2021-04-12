import "@material/mwc-icon-button";
import {
  mdiHelpCircle,
  mdiInformationOutline,
  mdiPencil,
  mdiPencilOff,
  mdiPlay,
  mdiPlus,
} from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateIcon } from "../../../common/entity/state_icon";
import { DataTableColumnContainer } from "../../../components/data-table/ha-data-table";
import "../../../components/ha-fab";
import "../../../components/ha-icon";
import "../../../components/ha-svg-icon";
import "../../../components/ha-button-related-filter-menu";
import { forwardHaptic } from "../../../data/haptics";
import { activateScene, SceneEntity } from "../../../data/scene";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { showToast } from "../../../util/toast";
import { configSections } from "../ha-panel-config";

@customElement("ha-scene-dashboard")
class HaSceneDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public narrow!: boolean;

  @property() public isWide!: boolean;

  @property() public route!: Route;

  @property() public scenes!: SceneEntity[];

  @property() private _activeFilters?: string[];

  @internalProperty() private _filteredScenes?: string[] | null;

  @internalProperty() private _filterValue?;

  private _scenes = memoizeOne(
    (scenes: SceneEntity[], filteredScenes?: string[] | null) => {
      if (filteredScenes === null) {
        return [];
      }
      return (filteredScenes
        ? scenes.filter((scene) => filteredScenes!.includes(scene.entity_id))
        : scenes
      ).map((scene) => {
        return {
          ...scene,
          name: computeStateName(scene),
          icon: stateIcon(scene),
        };
      });
    }
  );

  private _columns = memoizeOne(
    (_language): DataTableColumnContainer => {
      return {
        activate: {
          title: "",
          type: "icon-button",
          template: (_toggle, scene) =>
            html`
              <mwc-icon-button
                .scene=${scene}
                title="${this.opp.localize(
                  "ui.panel.config.scene.picker.activate_scene"
                )}"
                @click=${(ev: Event) => this._activateScene(ev)}
              >
                <ha-svg-icon .path=${mdiPlay}></ha-svg-icon>
              </mwc-icon-button>
            `,
        },
        icon: {
          title: "",
          type: "icon",
          template: (icon) => html` <ha-icon .icon=${icon}></ha-icon> `,
        },
        name: {
          title: this.opp.localize(
            "ui.panel.config.scene.picker.headers.name"
          ),
          sortable: true,
          filterable: true,
          direction: "asc",
          grows: true,
        },
        info: {
          title: "",
          type: "icon-button",
          template: (_info, scene) => html`
            <mwc-icon-button
              .scene=${scene}
              @click=${this._showInfo}
              title="${this.opp.localize(
                "ui.panel.config.scene.picker.show_info_scene"
              )}"
            >
              <ha-svg-icon .path=${mdiInformationOutline}></ha-svg-icon>
            </mwc-icon-button>
          `,
        },
        edit: {
          title: "",
          type: "icon-button",
          template: (_info, scene: any) => html`
            <a
              href=${ifDefined(
                scene.attributes.id
                  ? `/config/scene/edit/${scene.attributes.id}`
                  : undefined
              )}
            >
              <mwc-icon-button
                .disabled=${!scene.attributes.id}
                title="${this.opp.localize(
                  "ui.panel.config.scene.picker.edit_scene"
                )}"
              >
                <ha-svg-icon
                  .path=${scene.attributes.id ? mdiPencil : mdiPencilOff}
                ></ha-svg-icon>
              </mwc-icon-button>
            </a>
            ${!scene.attributes.id
              ? html`
                  <paper-tooltip animation-delay="0" position="left">
                    ${this.opp.localize(
                      "ui.panel.config.scene.picker.only_editable"
                    )}
                  </paper-tooltip>
                `
              : ""}
          `,
        },
      };
    }
  );

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.automation}
        .columns=${this._columns(this.opp.language)}
        id="entity_id"
        .data=${this._scenes(this.scenes, this._filteredScenes)}
        .activeFilters=${this._activeFilters}
        .noDataText=${this.opp.localize(
          "ui.panel.config.scene.picker.no_scenes"
        )}
        @clear-filter=${this._clearFilter}
        hasFab
      >
        <mwc-icon-button slot="toolbar-icon" @click=${this._showHelp}>
          <ha-svg-icon .path=${mdiHelpCircle}></ha-svg-icon>
        </mwc-icon-button>
        <ha-button-related-filter-menu
          slot="filter-menu"
          corner="BOTTOM_START"
          .narrow=${this.narrow}
          .opp=${this.opp}
          .value=${this._filterValue}
          exclude-domains='["scene"]'
          @related-changed=${this._relatedFilterChanged}
        >
        </ha-button-related-filter-menu>
        <a href="/config/scene/edit/new" slot="fab">
          <ha-fab
            .label=${this.opp.localize(
              "ui.panel.config.scene.picker.add_scene"
            )}
            extended
          >
            <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
          </ha-fab>
        </a>
      </opp-tabs-subpage-data-table>
    `;
  }

  private _relatedFilterChanged(ev: CustomEvent) {
    this._filterValue = ev.detail.value;
    if (!this._filterValue) {
      this._clearFilter();
      return;
    }
    this._activeFilters = [ev.detail.filter];
    this._filteredScenes = ev.detail.items.scene || null;
  }

  private _clearFilter() {
    this._filteredScenes = undefined;
    this._activeFilters = undefined;
    this._filterValue = undefined;
  }

  private _showInfo(ev) {
    ev.stopPropagation();
    const entityId = ev.currentTarget.scene.entity_id;
    fireEvent(this, "opp-more-info", { entityId });
  }

  private async _activateScene(ev) {
    ev.stopPropagation();
    const scene = ev.target.scene as SceneEntity;
    await activateScene(this.opp, scene.entity_id);
    showToast(this, {
      message: this.opp.localize(
        "ui.panel.config.scene.activated",
        "name",
        computeStateName(scene)
      ),
    });
    forwardHaptic("light");
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.scene.picker.header"),
      text: html`
        ${this.opp.localize("ui.panel.config.scene.picker.introduction")}
        <p>
          <a
            href="${documentationUrl(this.opp, "/docs/scene/editor/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize("ui.panel.config.scene.picker.learn_more")}
          </a>
        </p>
      `,
    });
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        a {
          text-decoration: none;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-scene-dashboard": HaSceneDashboard;
  }
}
