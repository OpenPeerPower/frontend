import "@material/mwc-icon-button";
import {
  mdiHelpCircle,
  mdiHistory,
  mdiInformationOutline,
  mdiPencil,
  mdiPencilOff,
  mdiPlus,
} from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import memoizeOne from "memoize-one";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import { formatDateTime } from "../../../common/datetime/format_date_time";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { navigate } from "../../../common/navigate";
import { DataTableColumnContainer } from "../../../components/data-table/ha-data-table";
import "../../../components/entity/ha-entity-toggle";
import "../../../components/ha-fab";
import "../../../components/ha-svg-icon";
import "../../../components/ha-button-related-filter-menu";
import {
  AutomationEntity,
  triggerAutomationActions,
} from "../../../data/automation";
import { UNAVAILABLE_STATES } from "../../../data/entity";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { configSections } from "../ha-panel-config";
import { showNewAutomationDialog } from "./show-dialog-new-automation";

@customElement("ha-automation-picker")
class HaAutomationPicker extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean }) public isWide!: boolean;

  @property({ type: Boolean }) public narrow!: boolean;

  @property() public route!: Route;

  @property() public automations!: AutomationEntity[];

  @property() private _activeFilters?: string[];

  @internalProperty() private _filteredAutomations?: string[] | null;

  @internalProperty() private _filterValue?;

  private _automations = memoizeOne(
    (
      automations: AutomationEntity[],
      filteredAutomations?: string[] | null
    ) => {
      if (filteredAutomations === null) {
        return [];
      }
      return (filteredAutomations
        ? automations.filter((automation) =>
            filteredAutomations!.includes(automation.entity_id)
          )
        : automations
      ).map((automation) => {
        return {
          ...automation,
          name: computeStateName(automation),
          last_triggered: automation.attributes.last_triggered || undefined,
        };
      });
    }
  );

  private _columns = memoizeOne(
    (narrow: boolean, _locale): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = {
        toggle: {
          title: "",
          type: "icon",
          template: (_toggle, automation: any) =>
            html`
              <ha-entity-toggle
                .opp=${this.opp}
                .stateObj=${automation}
              ></ha-entity-toggle>
            `,
        },
        name: {
          title: this.opp.localize(
            "ui.panel.config.automation.picker.headers.name"
          ),
          sortable: true,
          filterable: true,
          direction: "asc",
          grows: true,
          template: narrow
            ? (name, automation: any) =>
                html`
                  ${name}
                  <div class="secondary">
                    ${this.opp.localize("ui.card.automation.last_triggered")}:
                    ${automation.attributes.last_triggered
                      ? formatDateTime(
                          new Date(automation.attributes.last_triggered),
                          this.opp.locale
                        )
                      : this.opp.localize("ui.components.relative_time.never")}
                  </div>
                `
            : undefined,
        },
      };
      if (!narrow) {
        columns.last_triggered = {
          sortable: true,
          width: "20%",
          title: this.opp.localize("ui.card.automation.last_triggered"),
          template: (last_triggered) => html`
            ${last_triggered
              ? formatDateTime(new Date(last_triggered), this.opp.locale)
              : this.opp.localize("ui.components.relative_time.never")}
          `,
        };
        columns.trigger = {
          title: html`
            <mwc-button style="visibility: hidden">
              ${this.opp.localize("ui.card.automation.trigger")}
            </mwc-button>
          `,
          width: "20%",
          template: (_info, automation: any) => html`
            <mwc-button
              .automation=${automation}
              @click=${(ev) => this._runActions(ev)}
              .disabled=${UNAVAILABLE_STATES.includes(automation.state)}
            >
              ${this.opp.localize("ui.card.automation.trigger")}
            </mwc-button>
          `,
        };
      }
      columns.info = {
        title: "",
        type: "icon-button",
        template: (_info, automation) => html`
          <mwc-icon-button
            .automation=${automation}
            @click=${this._showInfo}
            .label="${this.opp.localize(
              "ui.panel.config.automation.picker.show_info_automation"
            )}"
          >
            <ha-svg-icon .path=${mdiInformationOutline}></ha-svg-icon>
          </mwc-icon-button>
        `,
      };
      columns.trace = {
        title: "",
        type: "icon-button",
        template: (_info, automation: any) => html`
          <a
            href=${ifDefined(
              automation.attributes.id
                ? `/config/automation/trace/${automation.attributes.id}`
                : undefined
            )}
          >
            <mwc-icon-button
              .label=${this.opp.localize(
                "ui.panel.config.automation.picker.dev_automation"
              )}
              .disabled=${!automation.attributes.id}
            >
              <ha-svg-icon .path=${mdiHistory}></ha-svg-icon>
            </mwc-icon-button>
          </a>
          ${!automation.attributes.id
            ? html`
                <paper-tooltip animation-delay="0" position="left">
                  ${this.opp.localize(
                    "ui.panel.config.automation.picker.dev_only_editable"
                  )}
                </paper-tooltip>
              `
            : ""}
        `,
      };
      columns.edit = {
        title: "",
        type: "icon-button",
        template: (_info, automation: any) => html`
          <a
            href=${ifDefined(
              automation.attributes.id
                ? `/config/automation/edit/${automation.attributes.id}`
                : undefined
            )}
          >
            <mwc-icon-button
              .disabled=${!automation.attributes.id}
              .label="${this.opp.localize(
                "ui.panel.config.automation.picker.edit_automation"
              )}"
            >
              <ha-svg-icon
                .path=${automation.attributes.id ? mdiPencil : mdiPencilOff}
              ></ha-svg-icon>
            </mwc-icon-button>
          </a>
          ${!automation.attributes.id
            ? html`
                <paper-tooltip animation-delay="0" position="left">
                  ${this.opp.localize(
                    "ui.panel.config.automation.picker.only_editable"
                  )}
                </paper-tooltip>
              `
            : ""}
        `,
      };
      return columns;
    }
  );

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        id="entity_id"
        .route=${this.route}
        .tabs=${configSections.automation}
        .activeFilters=${this._activeFilters}
        .columns=${this._columns(this.narrow, this.opp.locale)}
        .data=${this._automations(this.automations, this._filteredAutomations)}
        .noDataText=${this.opp.localize(
          "ui.panel.config.automation.picker.no_automations"
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
          exclude-domains='["automation"]'
          @related-changed=${this._relatedFilterChanged}
        >
        </ha-button-related-filter-menu>
        <ha-fab
          slot="fab"
          .label=${this.opp.localize(
            "ui.panel.config.automation.picker.add_automation"
          )}
          extended
          @click=${this._createNew}
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
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
    this._filteredAutomations = ev.detail.items.automation || null;
  }

  private _clearFilter() {
    this._filteredAutomations = undefined;
    this._activeFilters = undefined;
    this._filterValue = undefined;
  }

  private _showInfo(ev) {
    ev.stopPropagation();
    const entityId = ev.currentTarget.automation.entity_id;
    fireEvent(this, "opp-more-info", { entityId });
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.automation.caption"),
      text: html`
        ${this.opp.localize("ui.panel.config.automation.picker.introduction")}
        <p>
          <a
            href="${documentationUrl(this.opp, "/docs/automation/editor/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize(
              "ui.panel.config.automation.picker.learn_more"
            )}
          </a>
        </p>
      `,
    });
  }

  private _runActions(ev) {
    const entityId = ev.currentTarget.automation.entity_id;
    triggerAutomationActions(this.opp, entityId);
  }

  private _createNew() {
    if (
      isComponentLoaded(this.opp, "cloud") ||
      isComponentLoaded(this.opp, "blueprint")
    ) {
      showNewAutomationDialog(this);
    } else {
      navigate(this, "/config/automation/edit/new");
    }
  }

  static get styles(): CSSResult {
    return haStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-picker": HaAutomationPicker;
  }
}
