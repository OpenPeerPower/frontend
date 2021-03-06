import "@material/mwc-button/mwc-button";
import { mdiAlert, mdiCheck } from "@mdi/js";
import {
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { OPPDomEvent } from "../../../../../common/dom/fire_event";
import { navigate } from "../../../../../common/navigate";
import "../../../../../components/buttons/ha-call-service-button";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../../../components/data-table/ha-data-table";
import "../../../../../components/ha-card";
import "../../../../../components/ha-icon-next";
import { fetchOZWNodes, OZWDevice } from "../../../../../data/ozw";
import "../../../../../layouts/opp-tabs-subpage";
import "../../../../../layouts/opp-tabs-subpage-data-table";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../ha-config-section";
import { ozwNetworkTabs } from "./ozw-network-router";

export interface NodeRowData extends OZWDevice {
  node?: NodeRowData;
  id?: number;
}

@customElement("ozw-network-nodes")
class OZWNetworkNodes extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  @property() public ozwInstance = 0;

  @internalProperty() private _nodes: OZWDevice[] = [];

  private _columns = memoizeOne(
    (narrow: boolean): DataTableColumnContainer => {
      return {
        node_id: {
          title: this.opp.localize("ui.panel.config.ozw.nodes_table.id"),
          sortable: true,
          type: "numeric",
          width: "72px",
          filterable: true,
          direction: "asc",
        },
        node_product_name: {
          title: this.opp.localize("ui.panel.config.ozw.nodes_table.model"),
          sortable: true,
          width: narrow ? "75%" : "25%",
        },
        node_manufacturer_name: {
          title: this.opp.localize(
            "ui.panel.config.ozw.nodes_table.manufacturer"
          ),
          sortable: true,
          hidden: narrow,
          width: "25%",
        },
        node_query_stage: {
          title: this.opp.localize(
            "ui.panel.config.ozw.nodes_table.query_stage"
          ),
          sortable: true,
          width: narrow ? "25%" : "15%",
        },
        is_zwave_plus: {
          title: this.opp.localize(
            "ui.panel.config.ozw.nodes_table.zwave_plus"
          ),
          hidden: narrow,
          template: (value: boolean) =>
            value ? html` <ha-svg-icon .path=${mdiCheck}></ha-svg-icon>` : "",
        },
        is_failed: {
          title: this.opp.localize("ui.panel.config.ozw.nodes_table.failed"),
          hidden: narrow,
          template: (value: boolean) =>
            value ? html` <ha-svg-icon .path=${mdiAlert}></ha-svg-icon>` : "",
        },
      };
    }
  );

  protected firstUpdated() {
    if (!this.ozwInstance) {
      navigate(this, "/config/ozw/dashboard", true);
    } else if (this.opp) {
      this._fetchData();
    }
  }

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${ozwNetworkTabs(this.ozwInstance)}
        .columns=${this._columns(this.narrow)}
        .data=${this._nodes}
        id="node_id"
        @row-click=${this._handleRowClicked}
        clickable
      >
      </opp-tabs-subpage-data-table>
    `;
  }

  private async _fetchData() {
    this._nodes = await fetchOZWNodes(this.opp!, this.ozwInstance!);
  }

  private _handleRowClicked(ev: OPPDomEvent<RowClickedEvent>) {
    const nodeId = ev.detail.id;
    navigate(this, `/config/ozw/network/${this.ozwInstance}/node/${nodeId}`);
  }

  static get styles(): CSSResult {
    return haStyle;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ozw-network-nodes": OZWNetworkNodes;
  }
}
