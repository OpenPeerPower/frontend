import "@material/mwc-button/mwc-button";
import { mdiFolderMultipleOutline, mdiLan, mdiNetwork, mdiPlus } from "@mdi/js";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { computeRTL } from "../../../../../common/util/compute_rtl";
import "../../../../../components/ha-card";
import "../../../../../components/ha-fab";
import "../../../../../components/op-icon-next";
import "../../../../../layouts/opp-tabs-subpage";
import type { PageNavigation } from "../../../../../layouts/opp-tabs-subpage";
import { haStyle } from "../../../../../resources/styles";
import type { OpenPeerPower, Route } from "../../../../../types";
import "../../../ha-config-section";

export const zhaTabs: PageNavigation[] = [
  {
    translationKey: "ui.panel.config.zha.network.caption",
    path: `/config/zha/dashboard`,
    iconPath: mdiNetwork,
  },
  {
    translationKey: "ui.panel.config.zha.groups.caption",
    path: `/config/zha/groups`,
    iconPath: mdiFolderMultipleOutline,
  },
  {
    translationKey: "ui.panel.config.zha.visualization.caption",
    path: `/config/zha/visualization`,
    iconPath: mdiLan,
  },
];

@customElement("zha-config-dashboard")
class ZHAConfigDashboard extends LitElement {
  @property({ type: Object }) public opp!: OpenPeerPower;

  @property({ type: Object }) public route!: Route;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Boolean }) public isWide!: boolean;

  @property() public configEntryId?: string;

  protected render(): TemplateResult {
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${zhaTabs}
        back-path="/config/integrations"
      >
        <op-card header="Zigbee Network">
          <div class="card-content">
            In the future you can change network settings for ZHA here.
          </div>
          ${this.configEntryId
            ? html`<div class="card-actions">
                <a
                  href="${`/config/devices/dashboard?historyBack=1&config_entry=${this.configEntryId}`}"
                >
                  <mwc-button
                    >${this.opp.localize(
                      "ui.panel.config.devices.caption"
                    )}</mwc-button
                  >
                </a>
                <a
                  href="${`/config/entities/dashboard?historyBack=1&config_entry=${this.configEntryId}`}"
                >
                  <mwc-button
                    >${this.opp.localize(
                      "ui.panel.config.entities.caption"
                    )}</mwc-button
                  >
                </a>
              </div>`
            : ""}
        </op-card>
        <a href="/config/zha/add" slot="fab">
          <op-fab
            .label=${this.opp.localize("ui.panel.config.zha.add_device")}
            extended
            ?rtl=${computeRTL(this.opp)}
          >
            <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
          </op-fab>
        </a>
      </opp-tabs-subpage>
    `;
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        ha-card {
          margin: auto;
          margin-top: 16px;
          max-width: 500px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "zha-config-dashboard": ZHAConfigDashboard;
  }
}
