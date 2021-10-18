import "@polymer/paper-item/paper-item";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  internalProperty,
  LitElement,
  TemplateResult,
} from "lit-element";
import "../../../../components/dialog/op-paper-dialog";
import { createCloseHeading } from "../../../../components/op-dialog";
import "../../../../components/op-paper-dropdown-menu";
import {
  fetchConfig,
  fetchDashboards,
  LovelaceConfig,
  LovelaceDashboard,
} from "../../../../data/lovelace";
import { fireEvent } from "../../../../common/dom/fire_event";
import { haStyleDialog } from "../../../../resources/styles";
import { OpenPeerPower } from "../../../../types";
import "../../components/hui-views-list";
import type { SelectViewDialogParams } from "./show-select-view-dialog";

@customElement("hui-dialog-select-view")
export class HuiDialogSelectView extends LitElement {
  public opp!: OpenPeerPower;

  @internalProperty() private _params?: SelectViewDialogParams;

  @internalProperty() private _dashboards: LovelaceDashboard[] = [];

  @internalProperty() private _urlPath?: string | null;

  @internalProperty() private _config?: LovelaceConfig;

  public showDialog(params: SelectViewDialogParams): void {
    this._config = params.lovelaceConfig;
    this._urlPath = params.urlPath;
    this._params = params;
    if (this._params.allowDashboardChange) {
      this._getDashboards();
    }
  }

  public closeDialog(): void {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        hideActions
        .heading=${createCloseHeading(
          this.opp,
          this._params.header ||
            this.opp.localize("ui.panel.lovelace.editor.select_view.header")
        )}
      >
        ${this._params.allowDashboardChange
          ? html`<op-paper-dropdown-menu
              .label=${this.opp.localize(
                "ui.panel.lovelace.editor.select_view.dashboard_label"
              )}
              dynamic-align
              .disabled=${!this._dashboards.length}
            >
              <paper-listbox
                slot="dropdown-content"
                .selected=${this._urlPath || this.opp.defaultPanel}
                @iron-select=${this._dashboardChanged}
                attr-for-selected="url-path"
              >
                <paper-item
                  .urlPath=${"lovelace"}
                  .disabled=${(this.opp.panels.lovelace?.config as any)
                    ?.mode === "yaml"}
                >
                  Default
                </paper-item>
                ${this._dashboards.map((dashboard) => {
                  if (!this.opp.user!.is_admin && dashboard.require_admin) {
                    return "";
                  }
                  return html`
                    <paper-item
                      .disabled=${dashboard.mode !== "storage"}
                      .urlPath=${dashboard.url_path}
                      >${dashboard.title}</paper-item
                    >
                  `;
                })}
              </paper-listbox>
            </op-paper-dropdown-menu>`
          : ""}
        ${this._config
          ? html` <hui-views-list
              .lovelaceConfig=${this._config}
              @view-selected=${this._selectView}
            >
            </hui-views-list>`
          : html`<div>No config found.</div>`}
      </op-dialog>
    `;
  }

  private async _getDashboards() {
    this._dashboards =
      this._params!.dashboards || (await fetchDashboards(this.opp));
  }

  private async _dashboardChanged(ev: CustomEvent) {
    let urlPath: string | null = ev.detail.item.urlPath;
    if (urlPath === this._urlPath) {
      return;
    }
    if (urlPath === "lovelace") {
      urlPath = null;
    }
    this._urlPath = urlPath;
    try {
      this._config = await fetchConfig(this.opp.connection, urlPath, false);
    } catch (e) {
      this._config = undefined;
    }
  }

  private _selectView(e: CustomEvent): void {
    const view: number = e.detail.view;
    this._params!.viewSelectedCallback(this._urlPath!, this._config!, view);
    this.closeDialog();
  }

  static get styles(): CSSResultArray {
    return [
      haStyleDialog,
      css`
        op-paper-dropdown-menu {
          width: 100%;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-dialog-select-view": HuiDialogSelectView;
  }
}
