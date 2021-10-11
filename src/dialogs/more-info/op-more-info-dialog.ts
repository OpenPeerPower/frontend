import "@material/mwc-button";
import "@material/mwc-icon-button";
import "@material/mwc-tab";
import "@material/mwc-tab-bar";
import { mdiClose, mdiCog, mdiPencil } from "@mdi/js";
import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { cache } from "lit/directives/cache";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import {
  DOMAINS_MORE_INFO_NO_HISTORY,
  DOMAINS_WITH_MORE_INFO,
} from "../../common/const";
import { fireEvent } from "../../common/dom/fire_event";
import { computeDomain } from "../../common/entity/compute_domain";
import { computeStateName } from "../../common/entity/compute_state_name";
import { navigate } from "../../common/navigate";
import "../../components/op-dialog";
import "../../components/op-header-bar";
import "../../components/ha-svg-icon";
import { removeEntityRegistryEntry } from "../../data/entity_registry";
import { CONTINUOUS_DOMAINS } from "../../data/logbook";
import { showEntityEditorDialog } from "../../panels/config/entities/show-dialog-entity-editor";
import { haStyleDialog } from "../../resources/styles";
import "../../state-summary/state-card-content";
import { OpenPeerPower } from "../../types";
import { showConfirmationDialog } from "../generic/show-dialog-box";
import { replaceDialog } from "../make-dialog-manager";
import "./controls/more-info-default";
import "./op-more-info-history";
import "./op-more-info-logbook";
import "./more-info-content";

const DOMAINS_NO_INFO = ["camera", "configurator"];
/**
 * Entity domains that should be editable *if* they have an id present;
 * {@see shouldShowEditIcon}.
 * */
const EDITABLE_DOMAINS_WITH_ID = ["scene", "automation"];
/**
 * Entity Domains that should always be editable; {@see shouldShowEditIcon}.
 * */
const EDITABLE_DOMAINS = ["script"];

export interface MoreInfoDialogParams {
  entityId: string | null;
}

@customElement("op-more-info-dialog")
export class MoreInfoDialog extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean, reflect: true }) public large = false;

  @state() private _entityId?: string | null;

  @state() private _currTabIndex = 0;

  public showDialog(params: MoreInfoDialogParams) {
    this._entityId = params.entityId;
    if (!this._entityId) {
      this.closeDialog();
      return;
    }
    this.large = false;
  }

  public closeDialog() {
    this._entityId = undefined;
    this._currTabIndex = 0;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected shouldShowEditIcon(domain, stateObj): boolean {
    if (__DEMO__) {
      return false;
    }
    if (EDITABLE_DOMAINS_WITH_ID.includes(domain) && stateObj.attributes.id) {
      return true;
    }
    if (EDITABLE_DOMAINS.includes(domain)) {
      return true;
    }
    if (domain === "person" && stateObj.attributes.editable !== "false") {
      return true;
    }

    return false;
  }

  protected render() {
    if (!this._entityId) {
      return html``;
    }
    const entityId = this._entityId;
    const stateObj = this.opp.states[entityId];
    const domain = computeDomain(entityId);

    if (!stateObj) {
      return html``;
    }

    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        .heading=${true}
        hideActions
        data-domain=${domain}
      >
        <div slot="heading" class="heading">
          <op-header-bar>
            <mwc-icon-button
              slot="navigationIcon"
              dialogAction="cancel"
              .label=${this.opp.localize(
                "ui.dialogs.more_info_control.dismiss"
              )}
            >
              <op-svg-icon .path=${mdiClose}></op-svg-icon>
            </mwc-icon-button>
            <div slot="title" class="main-title" @click=${this._enlarge}>
              ${computeStateName(stateObj)}
            </div>
            ${this.opp.user!.is_admin
              ? html`
                  <mwc-icon-button
                    slot="actionItems"
                    .label=${this.opp.localize(
                      "ui.dialogs.more_info_control.settings"
                    )}
                    @click=${this._gotoSettings}
                  >
                    <op-svg-icon .path=${mdiCog}></op-svg-icon>
                  </mwc-icon-button>
                `
              : ""}
            ${this.shouldShowEditIcon(domain, stateObj)
              ? html`
                  <mwc-icon-button
                    slot="actionItems"
                    .label=${this.opp.localize(
                      "ui.dialogs.more_info_control.edit"
                    )}
                    @click=${this._gotoEdit}
                  >
                    <op-svg-icon .path=${mdiPencil}></op-svg-icon>
                  </mwc-icon-button>
                `
              : ""}
          </op-header-bar>
          ${DOMAINS_WITH_MORE_INFO.includes(domain) &&
          (this._computeShowHistoryComponent(entityId) ||
            this._computeShowLogBookComponent(entityId))
            ? html`
                <mwc-tab-bar
                  .activeIndex=${this._currTabIndex}
                  @MDCTabBar:activated=${this._handleTabChanged}
                >
                  <mwc-tab
                    .label=${this.opp.localize(
                      "ui.dialogs.more_info_control.details"
                    )}
                  ></mwc-tab>
                  <mwc-tab
                    .label=${this.opp.localize(
                      "ui.dialogs.more_info_control.history"
                    )}
                  ></mwc-tab>
                </mwc-tab-bar>
              `
            : ""}
        </div>
        <div class="content">
          ${cache(
            this._currTabIndex === 0
              ? html`
                  ${DOMAINS_NO_INFO.includes(domain)
                    ? ""
                    : html`
                        <state-card-content
                          in-dialog
                          .stateObj=${stateObj}
                          .opp=${this.opp}
                        ></state-card-content>
                      `}
                  ${DOMAINS_WITH_MORE_INFO.includes(domain) ||
                  !this._computeShowHistoryComponent(entityId)
                    ? ""
                    : html`<op-more-info-history
                        .opp=${this.opp}
                        .entityId=${this._entityId}
                      ></op-more-info-history>`}
                  ${DOMAINS_WITH_MORE_INFO.includes(domain) ||
                  !this._computeShowLogBookComponent(entityId)
                    ? ""
                    : html`<op-more-info-logbook
                        .opp=${this.opp}
                        .entityId=${this._entityId}
                      ></op-more-info-logbook>`}
                  <more-info-content
                    .stateObj=${stateObj}
                    .opp=${this.opp}
                  ></more-info-content>
                  ${stateObj.attributes.restored
                    ? html`
                        <p>
                          ${this.opp.localize(
                            "ui.dialogs.more_info_control.restored.not_provided"
                          )}
                        </p>
                        <p>
                          ${this.opp.localize(
                            "ui.dialogs.more_info_control.restored.remove_intro"
                          )}
                        </p>
                        <mwc-button
                          class="warning"
                          @click=${this._removeEntity}
                        >
                          ${this.opp.localize(
                            "ui.dialogs.more_info_control.restored.remove_action"
                          )}
                        </mwc-button>
                      `
                    : ""}
                `
              : html`
                  <op-more-info-history
                    .opp=${this.opp}
                    .entityId=${this._entityId}
                  ></op-more-info-history>
                  <op-more-info-logbook
                    .opp=${this.opp}
                    .entityId=${this._entityId}
                  ></op-more-info-logbook>
                `
          )}
        </div>
      </op-dialog>
    `;
  }

  private _enlarge() {
    this.large = !this.large;
  }

  private _computeShowHistoryComponent(entityId) {
    return (
      isComponentLoaded(this.opp, "history") &&
      !DOMAINS_MORE_INFO_NO_HISTORY.includes(computeDomain(entityId))
    );
  }

  private _computeShowLogBookComponent(entityId): boolean {
    if (!isComponentLoaded(this.opp, "logbook")) {
      return false;
    }

    const stateObj = this.opp.states[entityId];
    if (!stateObj || stateObj.attributes.unit_of_measurement) {
      return false;
    }

    const domain = computeDomain(entityId);
    if (
      CONTINUOUS_DOMAINS.includes(domain) ||
      DOMAINS_MORE_INFO_NO_HISTORY.includes(domain)
    ) {
      return false;
    }

    return true;
  }

  private _removeEntity() {
    const entityId = this._entityId!;
    showConfirmationDialog(this, {
      title: this.opp.localize(
        "ui.dialogs.more_info_control.restored.confirm_remove_title"
      ),
      text: this.opp.localize(
        "ui.dialogs.more_info_control.restored.confirm_remove_text"
      ),
      confirmText: this.opp.localize("ui.common.remove"),
      dismissText: this.opp.localize("ui.common.cancel"),
      confirm: () => {
        removeEntityRegistryEntry(this.opp, entityId);
      },
    });
  }

  private _gotoSettings() {
    replaceDialog();
    showEntityEditorDialog(this, {
      entity_id: this._entityId!,
    });
    this.closeDialog();
  }

  private _gotoEdit() {
    const stateObj = this.opp.states[this._entityId!];
    const domain = computeDomain(this._entityId!);
    let idToPassThroughUrl = stateObj.entity_id;
    if (EDITABLE_DOMAINS_WITH_ID.includes(domain) || domain === "person") {
      idToPassThroughUrl = stateObj.attributes.id;
    }

    navigate(`/config/${domain}/edit/${idToPassThroughUrl}`);
    this.closeDialog();
  }

  private _handleTabChanged(ev: CustomEvent): void {
    const newTab = ev.detail.index;
    if (newTab === this._currTabIndex) {
      return;
    }

    this._currTabIndex = ev.detail.index;
  }

  static get styles() {
    return [
      haStyleDialog,
      css`
        op-dialog {
          --dialog-surface-position: static;
          --dialog-content-position: static;
        }

        op-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
          display: block;
        }

        @media all and (max-width: 450px), all and (max-height: 500px) {
          op-header-bar {
            --mdc-theme-primary: var(--app-header-background-color);
            --mdc-theme-on-primary: var(--app-header-text-color, white);
            border-bottom: none;
          }
        }

        .heading {
          border-bottom: 1px solid
            var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
        }

        @media all and (min-width: 451px) and (min-height: 501px) {
          op-dialog {
            --mdc-dialog-max-width: 90vw;
          }

          .content {
            width: 352px;
          }

          op-header-bar {
            width: 400px;
          }

          .main-title {
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: default;
          }

          op-dialog[data-domain="camera"] .content,
          op-dialog[data-domain="camera"] op-header-bar {
            width: auto;
          }

          :host([large]) .content {
            width: calc(90vw - 48px);
          }

          :host([large]) op-dialog[data-domain="camera"] .content,
          :host([large]) op-header-bar {
            width: 90vw;
          }
        }

        op-dialog[data-domain="camera"] {
          --dialog-content-padding: 0;
        }

        state-card-content,
        op-more-info-history,
        op-more-info-logbook:not(:last-child) {
          display: block;
          margin-bottom: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-more-info-dialog": MoreInfoDialog;
  }
}
