import { mdiPlus } from "@mdi/js";
import "@polymer/paper-checkbox/paper-checkbox";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import memoize from "memoize-one";
import { compare } from "../../../../common/string/compare";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../../components/data-table/op-data-table";
import "../../../../components/op-fab";
import "../../../../components/op-icon";
import "../../../../components/op-svg-icon";
import {
  createResource,
  deleteResource,
  fetchResources,
  LovelaceResource,
  updateResource,
} from "../../../../data/lovelace";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../../dialogs/generic/show-dialog-box";
import "../../../../layouts/opp-loading-screen";
import "../../../../layouts/opp-tabs-subpage-data-table";
import { OpenPeerPower, Route } from "../../../../types";
import { loadLovelaceResources } from "../../../lovelace/common/load-resources";
import { lovelaceTabs } from "../op-config-lovelace";
import { showResourceDetailDialog } from "./show-dialog-lovelace-resource-detail";

@customElement("op-config-lovelace-resources")
export class HaConfigLovelaceRescources extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @internalProperty() private _resources: LovelaceResource[] = [];

  private _columns = memoize((_language): DataTableColumnContainer => {
    return {
      url: {
        title: this.opp.localize(
          "ui.panel.config.lovelace.resources.picker.headers.url"
        ),
        sortable: true,
        filterable: true,
        direction: "asc",
        grows: true,
        forceLTR: true,
      },
      type: {
        title: this.opp.localize(
          "ui.panel.config.lovelace.resources.picker.headers.type"
        ),
        sortable: true,
        filterable: true,
        width: "30%",
        template: (type) =>
          html`
            ${this.opp.localize(
              `ui.panel.config.lovelace.resources.types.${type}`
            ) || type}
          `,
      },
    };
  });

  protected render(): TemplateResult {
    if (!this.opp || this._resources === undefined) {
      return html` <opp-loading-screen></opp-loading-screen> `;
    }

    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${lovelaceTabs}
        .columns=${this._columns(this.opp.language)}
        .data=${this._resources}
        .noDataText=${this.opp.localize(
          "ui.panel.config.lovelace.resources.picker.no_resources"
        )}
        @row-click=${this._editResource}
        hasFab
        clickable
      >
        <op-fab
          slot="fab"
          .label=${this.opp.localize(
            "ui.panel.config.lovelace.resources.picker.add_resource"
          )}
          extended
          @click=${this._addResource}
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._getResources();
  }

  private async _getResources() {
    this._resources = await fetchResources(this.opp.connection);
  }

  private _editResource(ev: CustomEvent) {
    if ((this.opp.panels.lovelace?.config as any)?.mode !== "storage") {
      showAlertDialog(this, {
        text: this.opp!.localize(
          "ui.panel.config.lovelace.resources.cant_edit_yaml"
        ),
      });
      return;
    }
    const id = (ev.detail as RowClickedEvent).id;
    const resource = this._resources.find((res) => res.id === id);
    this._openDialog(resource);
  }

  private _addResource() {
    if ((this.opp.panels.lovelace?.config as any)?.mode !== "storage") {
      showAlertDialog(this, {
        text: this.opp!.localize(
          "ui.panel.config.lovelace.resources.cant_edit_yaml"
        ),
      });
      return;
    }
    this._openDialog();
  }

  private async _openDialog(resource?: LovelaceResource): Promise<void> {
    showResourceDetailDialog(this, {
      resource,
      createResource: async (values) => {
        const created = await createResource(this.opp!, values);
        this._resources = this._resources!.concat(created).sort((res1, res2) =>
          compare(res1.url, res2.url)
        );
        loadLovelaceResources([created], this.opp!.auth.data.oppUrl);
      },
      updateResource: async (values) => {
        const updated = await updateResource(this.opp!, resource!.id, values);
        this._resources = this._resources!.map((res) =>
          res === resource ? updated : res
        );
        loadLovelaceResources([updated], this.opp!.auth.data.oppUrl);
      },
      removeResource: async () => {
        if (
          !(await showConfirmationDialog(this, {
            text: this.opp!.localize(
              "ui.panel.config.lovelace.resources.confirm_delete"
            ),
          }))
        ) {
          return false;
        }

        try {
          await deleteResource(this.opp!, resource!.id);
          this._resources = this._resources!.filter((res) => res !== resource);
          showConfirmationDialog(this, {
            title: this.opp!.localize(
              "ui.panel.config.lovelace.resources.refresh_header"
            ),
            text: this.opp!.localize(
              "ui.panel.config.lovelace.resources.refresh_body"
            ),
            confirmText: this.opp.localize("ui.common.refresh"),
            dismissText: this.opp.localize("ui.common.not_now"),
            confirm: () => location.reload(),
          });
          return true;
        } catch (err) {
          return false;
        }
      },
    });
  }
}
