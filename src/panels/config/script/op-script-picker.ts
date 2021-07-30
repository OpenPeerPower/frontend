import "@material/mwc-icon-button";
import {
  mdiHelpCircle,
  mdiInformationOutline,
  mdiPencil,
  mdiPlay,
  mdiPlus,
} from "@mdi/js";
import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { formatDateTime } from "../../../common/datetime/format_date_time";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateIcon } from "../../../common/entity/state_icon";
import { computeRTL } from "../../../common/util/compute_rtl";
import { DataTableColumnContainer } from "../../../components/data-table/ha-data-table";
import "../../../components/ha-button-related-filter-menu";
import "../../../components/ha-fab";
import "../../../components/ha-svg-icon";
import { triggerScript } from "../../../data/script";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { showToast } from "../../../util/toast";
import { configSections } from "../ha-panel-config";

@customElement("ha-script-picker")
class HaScriptPicker extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public scripts!: OppEntity[];

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @property() private _activeFilters?: string[];

  @internalProperty() private _filteredScripts?: string[] | null;

  @internalProperty() private _filterValue?;

  private _scripts = memoizeOne(
    (scripts: OppEntity[], filteredScripts?: string[] | null) => {
      if (filteredScripts === null) {
        return [];
      }
      return (filteredScripts
        ? scripts.filter((script) =>
            filteredScripts!.includes(script.entity_id)
          )
        : scripts
      ).map((script) => {
        return {
          ...script,
          name: computeStateName(script),
          icon: stateIcon(script),
          last_triggered: script.attributes.last_triggered || undefined,
        };
      });
    }
  );

  private _columns = memoizeOne(
    (narrow, _locale): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = {
        activate: {
          title: "",
          type: "icon-button",
          template: (_toggle, script) =>
            html`
              <mwc-icon-button
                .script=${script}
                title="${this.opp.localize(
                  "ui.panel.config.script.picker.run_script"
                )}"
                @click=${(ev: Event) => this._runScript(ev)}
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
            "ui.panel.config.script.picker.headers.name"
          ),
          sortable: true,
          filterable: true,
          direction: "asc",
          grows: true,
          template: narrow
            ? (name, script: any) => html`
                ${name}
                <div class="secondary">
                  ${this.opp.localize("ui.card.automation.last_triggered")}:
                  ${script.attributes.last_triggered
                    ? formatDateTime(
                        new Date(script.attributes.last_triggered),
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
      }
      columns.info = {
        title: "",
        type: "icon-button",
        template: (_info, script) => html`
          <mwc-icon-button
            .script=${script}
            @click=${this._showInfo}
            title="${this.opp.localize(
              "ui.panel.config.script.picker.show_info"
            )}"
          >
            <ha-svg-icon .path=${mdiInformationOutline}></ha-svg-icon>
          </mwc-icon-button>
        `,
      };
      columns.edit = {
        title: "",
        type: "icon-button",
        template: (_info, script: any) => html`
          <a href="/config/script/edit/${script.entity_id}">
            <mwc-icon-button
              title="${this.opp.localize(
                "ui.panel.config.script.picker.edit_script"
              )}"
            >
              <ha-svg-icon .path=${mdiPencil}></ha-svg-icon>
            </mwc-icon-button>
          </a>
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
        .route=${this.route}
        .tabs=${configSections.automation}
        .columns=${this._columns(this.narrow, this.opp.locale)}
        .data=${this._scripts(this.scripts, this._filteredScripts)}
        .activeFilters=${this._activeFilters}
        id="entity_id"
        .noDataText=${this.opp.localize(
          "ui.panel.config.script.picker.no_scripts"
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
          exclude-domains='["script"]'
          @related-changed=${this._relatedFilterChanged}
        >
        </ha-button-related-filter-menu>
        <a href="/config/script/edit/new" slot="fab">
          <ha-fab
            ?is-wide=${this.isWide}
            ?narrow=${this.narrow}
            .label=${this.opp.localize(
              "ui.panel.config.script.picker.add_script"
            )}
            extended
            ?rtl=${computeRTL(this.opp)}
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
    this._filteredScripts = ev.detail.items.script || null;
  }

  private _clearFilter() {
    this._filteredScripts = undefined;
    this._activeFilters = undefined;
    this._filterValue = undefined;
  }

  private async _runScript(ev) {
    ev.stopPropagation();
    const script = ev.currentTarget.script as OppEntity;
    await triggerScript(this.opp, script.entity_id);
    showToast(this, {
      message: this.opp.localize(
        "ui.notification_toast.triggered",
        "name",
        computeStateName(script)
      ),
    });
  }

  private _showInfo(ev) {
    ev.stopPropagation();
    const entityId = ev.currentTarget.script.entity_id;
    fireEvent(this, "opp-more-info", { entityId });
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.script.caption"),
      text: html`
        ${this.opp.localize("ui.panel.config.script.picker.introduction")}
        <p>
          <a
            href="${documentationUrl(this.opp, "/docs/scripts/editor/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize("ui.panel.config.script.picker.learn_more")}
          </a>
        </p>
      `,
    });
  }

  static get styles(): CSSResult[] {
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
    "ha-script-picker": HaScriptPicker;
  }
}
