import { mdiPlus } from "@mdi/js";
import "@polymer/paper-checkbox/paper-checkbox";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-tooltip/paper-tooltip";
import { OppEntity } from "open-peer-power-js-websocket";
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
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { domainIcon } from "../../../common/entity/domain_icon";
import "../../../common/search/search-input";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../components/data-table/ha-data-table";
import "../../../components/ha-fab";
import "../../../components/ha-icon";
import "../../../components/ha-svg-icon";
import "../../../layouts/opp-loading-screen";
import "../../../layouts/opp-tabs-subpage-data-table";
import { OpenPeerPower, Route } from "../../../types";
import { showEntityEditorDialog } from "../entities/show-dialog-entity-editor";
import { configSections } from "../ha-panel-config";
import { HELPER_DOMAINS } from "./const";
import { showHelperDetailDialog } from "./show-dialog-helper-detail";

@customElement("ha-config-helpers")
export class HaConfigHelpers extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @internalProperty() private _stateItems: OppEntity[] = [];

  private _columns = memoize(
    (narrow, _language): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = {
        icon: {
          title: "",
          type: "icon",
          template: (icon, helper: any) => html`
            <ha-icon .icon=${icon || domainIcon(helper.type)}></ha-icon>
          `,
        },
        name: {
          title: this.opp.localize(
            "ui.panel.config.helpers.picker.headers.name"
          ),
          sortable: true,
          filterable: true,
          grows: true,
          direction: "asc",
          template: (name, item: any) =>
            html`
              ${name}
              ${narrow
                ? html`
                    <div class="secondary">
                      ${item.entity_id}
                    </div>
                  `
                : ""}
            `,
        },
      };
      if (!narrow) {
        columns.entity_id = {
          title: this.opp.localize(
            "ui.panel.config.helpers.picker.headers.entity_id"
          ),
          sortable: true,
          filterable: true,
          width: "25%",
        };
      }
      columns.type = {
        title: this.opp.localize(
          "ui.panel.config.helpers.picker.headers.type"
        ),
        sortable: true,
        width: "25%",
        filterable: true,
        template: (type) =>
          html`
            ${this.opp.localize(`ui.panel.config.helpers.types.${type}`) ||
            type}
          `,
      };
      columns.editable = {
        title: "",
        type: "icon",
        template: (editable) => html`
          ${!editable
            ? html`
                <div
                  tabindex="0"
                  style="display:inline-block; position: relative;"
                >
                  <ha-icon icon="opp:pencil-off"></ha-icon>
                  <paper-tooltip animation-delay="0" position="left">
                    ${this.opp.localize(
                      "ui.panel.config.entities.picker.status.readonly"
                    )}
                  </paper-tooltip>
                </div>
              `
            : ""}
        `,
      };
      return columns;
    }
  );

  private _getItems = memoize((stateItems: OppEntity[]) => {
    return stateItems.map((state) => {
      return {
        id: state.entity_id,
        icon: state.attributes.icon,
        name: state.attributes.friendly_name || "",
        entity_id: state.entity_id,
        editable: state.attributes.editable,
        type: computeStateDomain(state),
      };
    });
  });

  protected render(): TemplateResult {
    if (!this.opp || this._stateItems === undefined) {
      return html` <opp-loading-screen></opp-loading-screen> `;
    }

    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.helpers}
        .columns=${this._columns(this.narrow, this.opp.language)}
        .data=${this._getItems(this._stateItems)}
        @row-click=${this._openEditDialog}
        hasFab
        clickable
        .noDataText=${this.opp.localize(
          "ui.panel.config.helpers.picker.no_helpers"
        )}
      >
        <ha-fab
          slot="fab"
          .label=${this.opp.localize(
            "ui.panel.config.helpers.picker.add_helper"
          )}
          extended
          @click=${this._createHelpler}
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._getStates();
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    if (oldOpp && this._stateItems) {
      this._getStates(oldOpp);
    }
  }

  private _getStates(oldOpp?: OpenPeerPower) {
    let changed = false;
    const tempStates = Object.values(this.opp!.states).filter((entity) => {
      if (!HELPER_DOMAINS.includes(computeStateDomain(entity))) {
        return false;
      }
      if (oldOpp?.states[entity.entity_id] !== entity) {
        changed = true;
      }
      return true;
    });

    if (changed || this._stateItems.length !== tempStates.length) {
      this._stateItems = tempStates;
    }
  }

  private async _openEditDialog(ev: CustomEvent): Promise<void> {
    const entityId = (ev.detail as RowClickedEvent).id;
    showEntityEditorDialog(this, {
      entity_id: entityId,
    });
  }

  private _createHelpler() {
    showHelperDetailDialog(this);
  }
}
