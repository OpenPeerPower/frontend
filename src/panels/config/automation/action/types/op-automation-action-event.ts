import "@polymer/paper-input/paper-input";
import {
  customElement,
  LitElement,
  property,
  PropertyValues,
  query,
} from "lit-element";
import { html } from "lit-html";
import { fireEvent } from "../../../../../common/dom/fire_event";
import "../../../../../components/entity/op-entity-picker";
import "../../../../../components/op-service-picker";
import "../../../../../components/op-yaml-editor";
import type { HaYamlEditor } from "../../../../../components/op-yaml-editor";
import type { EventAction } from "../../../../../data/script";
import type { OpenPeerPower } from "../../../../../types";
import { ActionElement, handleChangeEvent } from "../op-automation-action-row";

@customElement("op-automation-action-event")
export class HaEventAction extends LitElement implements ActionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public action!: EventAction;

  @query("op-yaml-editor", true) private _yamlEditor?: HaYamlEditor;

  private _actionData?: EventAction["event_data"];

  public static get defaultConfig(): EventAction {
    return { event: "", event_data: {} };
  }

  protected updated(changedProperties: PropertyValues) {
    if (!changedProperties.has("action")) {
      return;
    }
    if (this._actionData && this._actionData !== this.action.event_data) {
      if (this._yamlEditor) {
        this._yamlEditor.setValue(this.action.event_data);
      }
    }
    this._actionData = this.action.event_data;
  }

  protected render() {
    const { event, event_data } = this.action;

    return html`
      <paper-input
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.event.event"
        )}
        name="event"
        .value=${event}
        @value-changed=${this._eventChanged}
      ></paper-input>
      <op-yaml-editor
        .label=${this.opp.localize(
          "ui.panel.config.automation.editor.actions.type.event.service_data"
        )}
        .name=${"event_data"}
        .defaultValue=${event_data}
        @value-changed=${this._dataChanged}
      ></op-yaml-editor>
    `;
  }

  private _dataChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!ev.detail.isValid) {
      return;
    }
    this._actionData = ev.detail.value;
    handleChangeEvent(this, ev);
  }

  private _eventChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    fireEvent(this, "value-changed", {
      value: { ...this.action, event: ev.detail.value },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-action-event": HaEventAction;
  }
}
