import "@material/mwc-icon-button";
import {
  mdiDelete,
  mdiDownload,
  mdiHelpCircle,
  mdiRobot,
  mdiShareVariant,
} from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../common/dom/fire_event";
import { navigate } from "../../../common/navigate";
import { extractSearchParam } from "../../../common/url/search-params";
import { DataTableColumnContainer } from "../../../components/data-table/op-data-table";
import "../../../components/entity/op-entity-toggle";
import "../../../components/op-fab";
import "../../../components/op-svg-icon";
import { showAutomationEditor } from "../../../data/automation";
import {
  BlueprintMetaData,
  Blueprints,
  deleteBlueprint,
} from "../../../data/blueprint";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { configSections } from "../op-panel-config";
import { showAddBlueprintDialog } from "./show-dialog-import-blueprint";

interface BlueprintMetaDataPath extends BlueprintMetaData {
  path: string;
  error: boolean;
}

const createNewFunctions = {
  automation: (
    context: HaBlueprintOverview,
    blueprintMeta: BlueprintMetaDataPath
  ) => {
    showAutomationEditor(context, {
      alias: blueprintMeta.name,
      use_blueprint: { path: blueprintMeta.path },
    });
  },
};

@customElement("op-blueprint-overview")
class HaBlueprintOverview extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public isWide!: boolean;

  @property({ type: Boolean }) public narrow!: boolean;

  @property() public route!: Route;

  @property() public blueprints!: Blueprints;

  private _processedBlueprints = memoizeOne((blueprints: Blueprints) => {
    const result = Object.entries(blueprints).map(([path, blueprint]) => {
      if ("error" in blueprint) {
        return {
          name: blueprint.error,
          error: true,
          path,
        };
      }
      return {
        ...blueprint.metadata,
        error: false,
        path,
      };
    });
    return result;
  });

  private _columns = memoizeOne(
    (narrow, _language): DataTableColumnContainer => ({
      name: {
        title: this.opp.localize(
          "ui.panel.config.blueprint.overview.headers.name"
        ),
        sortable: true,
        filterable: true,
        direction: "asc",
        grows: true,
        template: narrow
          ? (name, entity: any) =>
              html`
                ${name}<br />
                <div class="secondary">${entity.path}</div>
              `
          : undefined,
      },
      path: {
        title: this.opp.localize(
          "ui.panel.config.blueprint.overview.headers.file_name"
        ),
        sortable: true,
        filterable: true,
        hidden: narrow,
        direction: "asc",
        width: "25%",
      },
      create: {
        title: "",
        type: narrow ? "icon-button" : undefined,
        template: (_, blueprint: any) =>
          blueprint.error
            ? ""
            : narrow
            ? html`<mwc-icon-button
                .blueprint=${blueprint}
                .label=${this.opp.localize(
                  "ui.panel.config.blueprint.overview.use_blueprint"
                )}
                title=${this.opp.localize(
                  "ui.panel.config.blueprint.overview.use_blueprint"
                )}
                @click=${(ev) => this._createNew(ev)}
              >
                <op-svg-icon .path=${mdiRobot}></op-svg-icon>
              </mwc-icon-button>`
            : html`<mwc-button
                .blueprint=${blueprint}
                @click=${(ev) => this._createNew(ev)}
              >
                ${this.opp.localize(
                  "ui.panel.config.blueprint.overview.use_blueprint"
                )}
              </mwc-button>`,
      },
      share: {
        title: "",
        type: "icon-button",
        template: (_, blueprint: any) =>
          blueprint.error
            ? ""
            : html`<mwc-icon-button
                .blueprint=${blueprint}
                .disabled=${!blueprint.source_url}
                .label=${this.opp.localize(
                  blueprint.source_url
                    ? "ui.panel.config.blueprint.overview.share_blueprint"
                    : "ui.panel.config.blueprint.overview.share_blueprint_no_url"
                )}
                @click=${(ev) => this._share(ev)}
                ><op-svg-icon .path=${mdiShareVariant}></op-svg-icon
              ></mwc-icon-button>`,
      },
      delete: {
        title: "",
        type: "icon-button",
        template: (_, blueprint: any) =>
          blueprint.error
            ? ""
            : html` <mwc-icon-button
                .blueprint=${blueprint}
                .label=${this.opp.localize(
                  "ui.panel.config.blueprint.overview.delete_blueprint"
                )}
                @click=${(ev) => this._delete(ev)}
                ><op-svg-icon .path=${mdiDelete}></op-svg-icon
              ></mwc-icon-button>`,
      },
    })
  );

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this.route.path === "/import") {
      const url = extractSearchParam("blueprint_url");
      navigate(this, "/config/blueprint/dashboard", true);
      if (url) {
        this._addBlueprint(url);
      }
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.automation}
        .columns=${this._columns(this.narrow, this.opp.language)}
        .data=${this._processedBlueprints(this.blueprints)}
        id="entity_id"
        .noDataText=${this.opp.localize(
          "ui.panel.config.blueprint.overview.no_blueprints"
        )}
        hasFab
        .appendRow=${html` <div
          class="mdc-data-table__cell"
          style="width: 100%; text-align: center;"
          role="cell"
        >
          <a
            href="https://www.openpeerpower.io/get-blueprints"
            target="_blank"
            rel="noreferrer noopener"
          >
            <mwc-button
              >${this.opp.localize(
                "ui.panel.config.blueprint.overview.discover_more"
              )}</mwc-button
            >
          </a>
        </div>`}
      >
        <mwc-icon-button slot="toolbar-icon" @click=${this._showHelp}>
          <op-svg-icon .path=${mdiHelpCircle}></op-svg-icon>
        </mwc-icon-button>
        <op-fab
          slot="fab"
          .label=${this.opp.localize(
            "ui.panel.config.blueprint.overview.add_blueprint"
          )}
          extended
          @click=${this._addBlueprintClicked}
        >
          <op-svg-icon slot="icon" .path=${mdiDownload}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.blueprint.caption"),
      text: html`
        ${this.opp.localize("ui.panel.config.blueprint.overview.introduction")}
        <p>
          <a
            href="${documentationUrl(
              this.opp,
              "/docs/automation/using_blueprints/"
            )}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize(
              "ui.panel.config.blueprint.overview.learn_more"
            )}
          </a>
        </p>
      `,
    });
  }

  private _addBlueprint(url?: string) {
    showAddBlueprintDialog(this, {
      url,
      importedCallback: () => this._reload(),
    });
  }

  private _addBlueprintClicked(): void {
    this._addBlueprint();
  }

  private _reload() {
    fireEvent(this, "reload-blueprints");
  }

  private _createNew(ev) {
    const blueprint = ev.currentTarget.blueprint as BlueprintMetaDataPath;
    createNewFunctions[blueprint.domain](this, blueprint);
  }

  private _share(ev) {
    const blueprint = ev.currentTarget.blueprint;
    const params = new URLSearchParams();
    params.append("redirect", "blueprint_import");
    params.append("blueprint_url", blueprint.source_url);
    window.open(
      `https://my.openpeerpower.io/create-link/?${params.toString()}`
    );
  }

  private async _delete(ev) {
    const blueprint = ev.currentTarget.blueprint;
    if (
      !(await showConfirmationDialog(this, {
        title: this.opp.localize(
          "ui.panel.config.blueprint.overview.confirm_delete_header"
        ),
        text: this.opp.localize(
          "ui.panel.config.blueprint.overview.confirm_delete_text"
        ),
      }))
    ) {
      return;
    }
    await deleteBlueprint(this.opp, blueprint.domain, blueprint.path);
    fireEvent(this, "reload-blueprints");
  }

  static get styles(): CSSResult {
    return haStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-blueprint-overview": HaBlueprintOverview;
  }
}
