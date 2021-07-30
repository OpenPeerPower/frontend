import "@material/mwc-button";
import { OppEntity } from "openpeerpower-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
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
      ${this.stateObj.attributes.latitude && this.stateObj.attributes.longitude
        ? html`
            <op-map
              .opp=${this.opp}
              .entities=${this._entityArray(this.stateObj.entity_id)}
              autoFit
            ></op-map>
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
      <op-attributes
        .opp=${this.opp}
        .stateObj=${this.stateObj}
        extra-filters="id,user_id,editable"
      ></op-attributes>
    `;
  }

  private _handleAction() {
    showZoneEditor({
      latitude: this.stateObj!.attributes.latitude,
      longitude: this.stateObj!.attributes.longitude,
    });
    fireEvent(this, "opp-more-info", { entityId: null });
  }

  static get styles(): CSSResultGroup {
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
