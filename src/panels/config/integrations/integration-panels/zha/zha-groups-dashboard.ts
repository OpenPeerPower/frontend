import "@material/mwc-button";
import { mdiPlus } from "@mdi/js";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { OPPDomEvent } from "../../../../../common/dom/fire_event";
import { navigate } from "../../../../../common/navigate";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../../../components/data-table/ha-data-table";
import "../../../../../components/ha-fab";
import "../../../../../components/ha-icon-button";
import { fetchGroups, ZHADevice, ZHAGroup } from "../../../../../data/zha";
import "../../../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../../../resources/styles";
import { OpenPeerPower, Route } from "../../../../../types";
import { formatAsPaddedHex, sortZHAGroups } from "./functions";
import { zhaTabs } from "./zha-config-dashboard";

export interface GroupRowData extends ZHAGroup {
  group?: GroupRowData;
  id?: string;
}

@customElement("zha-groups-dashboard")
export class ZHAGroupsDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public _groups: ZHAGroup[] = [];

  private _firstUpdatedCalled = false;

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.opp && this._firstUpdatedCalled) {
      this._fetchGroups();
    }
  }

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    if (this.opp) {
      this._fetchGroups();
    }
    this._firstUpdatedCalled = true;
  }

  private _formattedGroups = memoizeOne((groups: ZHAGroup[]) => {
    let outputGroups: GroupRowData[] = groups;

    outputGroups = outputGroups.map((group) => {
      return {
        ...group,
        id: String(group.group_id),
      };
    });

    return outputGroups;
  });

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer =>
      narrow
        ? {
            name: {
              title: "Group",
              sortable: true,
              filterable: true,
              direction: "asc",
              grows: true,
            },
          }
        : {
            name: {
              title: this.opp.localize("ui.panel.config.zha.groups.groups"),
              sortable: true,
              filterable: true,
              direction: "asc",
              grows: true,
            },
            group_id: {
              title: this.opp.localize("ui.panel.config.zha.groups.group_id"),
              type: "numeric",
              width: "15%",
              template: (groupId: number) => {
                return html` ${formatAsPaddedHex(groupId)} `;
              },
              sortable: true,
            },
            members: {
              title: this.opp.localize("ui.panel.config.zha.groups.members"),
              type: "numeric",
              width: "15%",
              template: (members: ZHADevice[]) => {
                return html` ${members.length} `;
              },
              sortable: true,
            },
          }
  );

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .tabs=${zhaTabs}
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .columns=${this._columns(this.narrow)}
        .data=${this._formattedGroups(this._groups)}
        @row-click=${this._handleRowClicked}
        clickable
      >
        <a href="/config/zha/group-add" slot="fab">
          <ha-fab
            .label=${this.opp!.localize(
              "ui.panel.config.zha.groups.add_group"
            )}
            extended
          >
            <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
          </ha-fab>
        </a>
      </opp-tabs-subpage-data-table>
    `;
  }

  private async _fetchGroups() {
    this._groups = (await fetchGroups(this.opp!)).sort(sortZHAGroups);
  }

  private _handleRowClicked(ev: OPPDomEvent<RowClickedEvent>) {
    const groupId = ev.detail.id;
    navigate(this, `/config/zha/group/${groupId}`);
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        a {
          color: var(--primary-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zha-groups-dashboard": ZHAGroupsDashboard;
  }
}
