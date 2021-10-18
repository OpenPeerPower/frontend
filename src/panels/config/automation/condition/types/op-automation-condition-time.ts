import { Radio } from "@material/mwc-radio";
import "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
} from "lit-element";
import { fireEvent } from "../../../../../common/dom/fire_event";
import { computeRTLDirection } from "../../../../../common/util/compute_rtl";
import "../../../../../components/op-formfield";
import "../../../../../components/op-radio";
import { HaSwitch } from "../../../../../components/op-switch";
import { TimeCondition } from "../../../../../data/automation";
import { OpenPeerPower } from "../../../../../types";
import {
  ConditionElement,
  handleChangeEvent,
} from "../op-automation-condition-row";

const includeDomains = ["input_datetime"];

const DAYS = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

interface WeekdayHaSwitch extends HaSwitch {
  day: string;
}

@customElement("op-automation-condition-time")
export class HaTimeCondition extends LitElement implements ConditionElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public condition!: TimeCondition;

  @internalProperty() private _inputModeBefore?: boolean;

  @internalProperty() private _inputModeAfter?: boolean;

  public static get defaultConfig() {
    return {};
  }

  protected render() {
    const { after, before, weekday } = this.condition;

    const inputModeBefore =
      this._inputModeBefore ?? before?.startsWith("input_datetime.");
    const inputModeAfter =
      this._inputModeAfter ?? after?.startsWith("input_datetime.");

    return html`
      <op-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.conditions.type.time.type_value"
        )}
      >
        <op-radio
          @change=${this._handleModeChanged}
          name="mode_after"
          value="value"
          ?checked=${!inputModeAfter}
        ></op-radio>
      </op-formfield>
      <op-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.conditions.type.time.type_input"
        )}
      >
        <op-radio
          @change=${this._handleModeChanged}
          name="mode_after"
          value="input"
          ?checked=${inputModeAfter}
        ></op-radio>
      </op-formfield>
      ${inputModeAfter
        ? html`<op-entity-picker
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.type.time.after"
            )}
            .includeDomains=${includeDomains}
            .name=${"after"}
            .value=${after?.startsWith("input_datetime.") ? after : ""}
            @value-changed=${this._valueChanged}
            .opp=${this.opp}
            allow-custom-entity
          ></op-entity-picker>`
        : html`<paper-input
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.type.time.after"
            )}
            name="after"
            .value=${after?.startsWith("input_datetime.") ? "" : after}
            @value-changed=${this._valueChanged}
          ></paper-input>`}

      <op-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.conditions.type.time.type_value"
        )}
      >
        <op-radio
          @change=${this._handleModeChanged}
          name="mode_before"
          value="value"
          ?checked=${!inputModeBefore}
        ></op-radio>
      </op-formfield>
      <op-formfield
        .label=${this.opp!.localize(
          "ui.panel.config.automation.editor.conditions.type.time.type_input"
        )}
      >
        <op-radio
          @change=${this._handleModeChanged}
          name="mode_before"
          value="input"
          ?checked=${inputModeBefore}
        ></op-radio>
      </op-formfield>
      ${inputModeBefore
        ? html`<op-entity-picker
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.type.time.before"
            )}
            .includeDomains=${includeDomains}
            .name=${"before"}
            .value=${before?.startsWith("input_datetime.") ? before : ""}
            @value-changed=${this._valueChanged}
            .opp=${this.opp}
          ></op-entity-picker>`
        : html`<paper-input
            .label=${this.opp.localize(
              "ui.panel.config.automation.editor.conditions.type.time.before"
            )}
            name="before"
            .value=${before?.startsWith("input_datetime.") ? "" : before}
            @value-changed=${this._valueChanged}
          ></paper-input>`}
      ${Object.keys(DAYS).map(
        (day) => html`
          <op-formfield
            alignEnd
            spaceBetween
            class="weekday-toggle"
            .label=${this.opp!.localize(
              `ui.panel.config.automation.editor.conditions.type.time.weekdays.${day}`
            )}
            .dir=${computeRTLDirection(this.opp!)}
          >
            <op-switch
              .day=${day}
              .checked=${!weekday || weekday === day || weekday.includes(day)}
              @change=${this._dayValueChanged}
            >
            </op-switch>
          </op-formfield>
        `
      )}
    `;
  }

  private _handleModeChanged(ev: Event) {
    const target = ev.target as Radio;
    if (target.getAttribute("name") === "mode_after") {
      this._inputModeAfter = target.value === "input";
    } else {
      this._inputModeBefore = target.value === "input";
    }
  }

  private _valueChanged(ev: CustomEvent): void {
    handleChangeEvent(this, ev);
  }

  private _dayValueChanged(ev: CustomEvent): void {
    const daySwitch = ev.currentTarget as WeekdayHaSwitch;

    let days: string[];

    if (!this.condition.weekday) {
      days = Object.keys(DAYS);
    } else {
      days = !Array.isArray(this.condition.weekday)
        ? [this.condition.weekday]
        : this.condition.weekday;
    }

    if (daySwitch.checked) {
      days.push(daySwitch.day);
    } else {
      days = days.filter((d) => d !== daySwitch.day);
    }

    days.sort((a: string, b: string) => DAYS[a] - DAYS[b]);

    fireEvent(this, "value-changed", {
      value: { ...this.condition, weekday: days },
    });
  }

  static get styles(): CSSResult {
    return css`
      .weekday-toggle {
        display: flex;
        height: 40px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-condition-time": HaTimeCondition;
  }
}
