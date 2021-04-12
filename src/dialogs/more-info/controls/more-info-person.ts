import "@material/mwc-button";
import { OppEntity } from "open-peer-power-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/ha-attributes";
import "../../../components/map/ha-map";
import { showZoneEditor } from "../../../data/zone";
import { OpenPeerPower } from "../../../types";

@customElement("more-info-person")
class MoreInfoPerson extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public stateObj?: OppEntity;

  private _entityArray = memoizeOne((entityId: string) => [entityId]);

  protected render(): TemplateResult {
    if (!this.opp || !this.stateObj) {
      return html``;
    }

    return html`
      <ha-attributes
        .stateObj=${this.stateObj}
        extra-filters="id,user_id,editable"
      ></ha-attributes>
      ${this.stateObj.attributes.latitude && this.stateObj.attributes.longitude
        ? html`
            <ha-map
              .opp=${this.opp}
              .entities=${this._entityArray(this.stateObj.entity_id)}
            ></ha-map>
          `
        : ""}
      ${!__DEMO__ &&
      this.opp.user?.is_admin &&
      this.stateObj.state === "not_home" &&
      this.stateObj.attributes.latitude &&
      this.stateObj.attributes.longitude
        ? html`
            <div class="actions">
              <mwc-button @click=${this._handleAction}>
                ${this.opp.localize(
                  "ui.dialogs.more_info_control.person.create_zone"
                )}
              </mwc-button>
            </div>
          `
        : ""}
    `;
  }

  private _handleAction() {
    showZoneEditor(this, {
      latitude: this.stateObj!.attributes.latitude,
      longitude: this.stateObj!.attributes.longitude,
    });
    fireEvent(this, "opp-more-info", { entityId: null });
  }

  static get styles(): CSSResult {
    return css`
      .flex {
        display: flex;
        justify-content: space-between;
      }
      .actions {
        margin: 8px 0;
        text-align: right;
      }
      ha-map {
        margin-top: 16px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-person": MoreInfoPerson;
  }
}
