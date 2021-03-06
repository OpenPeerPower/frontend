import "@polymer/iron-flex-layout/iron-flex-layout-classes";
import "@polymer/paper-input/paper-input";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import { attributeClassNames } from "../../../common/entity/attribute_class_names";
import "../../../components/ha-date-input";
import "../../../components/ha-relative-time";
import "../../../components/paper-time-input";

class DatetimeInput extends PolymerElement {
  static get template() {
    return html`
      <div class$="[[computeClassNames(stateObj)]]">
        <template is="dom-if" if="[[doesHaveDate(stateObj)]]" restamp="">
          <div>
            <ha-date-input
              id="dateInput"
              label="Date"
              value="{{selectedDate}}"
            ></ha-date-input>
          </div>
        </template>
        <template is="dom-if" if="[[doesHaveTime(stateObj)]]" restamp="">
          <div>
            <paper-time-input
              hour="{{selectedHour}}"
              min="{{selectedMinute}}"
              format="24"
            ></paper-time-input>
          </div>
        </template>
      </div>
    `;
  }

  constructor() {
    super();
    this.is_ready = false;
  }

  static get properties() {
    return {
      opp: {
        type: Object,
      },

      stateObj: {
        type: Object,
        observer: "stateObjChanged",
      },

      selectedDate: {
        type: String,
        observer: "dateTimeChanged",
      },

      selectedHour: {
        type: Number,
        observer: "dateTimeChanged",
      },

      selectedMinute: {
        type: Number,
        observer: "dateTimeChanged",
      },
    };
  }

  ready() {
    super.ready();
    this.is_ready = true;
  }

  /* Convert the date in the stateObj into a string useable by vaadin-date-picker */
  getDateString(stateObj) {
    if (stateObj.state === "unknown") {
      return "";
    }
    let monthFiller;
    if (stateObj.attributes.month < 10) {
      monthFiller = "0";
    } else {
      monthFiller = "";
    }

    let dayFiller;
    if (stateObj.attributes.day < 10) {
      dayFiller = "0";
    } else {
      dayFiller = "";
    }

    return (
      stateObj.attributes.year +
      "-" +
      monthFiller +
      stateObj.attributes.month +
      "-" +
      dayFiller +
      stateObj.attributes.day
    );
  }

  /* Should fire when any value was changed *by the user*, not b/c of setting
   * initial values. */
  dateTimeChanged() {
    // Check if the change is really coming from the user
    if (!this.is_ready) {
      return;
    }

    let changed = false;
    let minuteFiller;

    const serviceData = {
      entity_id: this.stateObj.entity_id,
    };

    if (this.stateObj.attributes.has_time) {
      changed =
        changed ||
        parseInt(this.selectedMinute) !== this.stateObj.attributes.minute;
      changed =
        changed ||
        parseInt(this.selectedHour) !== this.stateObj.attributes.hour;
      if (this.selectedMinute < 10) {
        minuteFiller = "0";
      } else {
        minuteFiller = "";
      }
      const timeStr =
        this.selectedHour + ":" + minuteFiller + this.selectedMinute;
      serviceData.time = timeStr;
    }

    if (this.stateObj.attributes.has_date) {
      if (this.selectedDate.length === 0) {
        return; // Date was not set
      }

      const dateValInput = new Date(this.selectedDate);
      const dateValState = new Date(
        this.stateObj.attributes.year,
        this.stateObj.attributes.month - 1,
        this.stateObj.attributes.day
      );

      changed = changed || dateValState !== dateValInput;

      serviceData.date = this.selectedDate;
    }

    if (changed) {
      this.opp.callService("input_datetime", "set_datetime", serviceData);
    }
  }

  stateObjChanged(newVal) {
    // Set to non-ready s.t. dateTimeChanged does not fire
    this.is_ready = false;

    if (newVal.attributes.has_time) {
      this.selectedHour = newVal.attributes.hour;
      this.selectedMinute = newVal.attributes.minute;
    }

    if (newVal.attributes.has_date) {
      this.selectedDate = this.getDateString(newVal);
    }

    this.is_ready = true;
  }

  doesHaveDate(stateObj) {
    return stateObj.attributes.has_date;
  }

  doesHaveTime(stateObj) {
    return stateObj.attributes.has_time;
  }

  computeClassNames(stateObj) {
    return (
      "more-info-input_datetime " +
      attributeClassNames(stateObj, ["has_time", "has_date"])
    );
  }
}

customElements.define("more-info-input_datetime", DatetimeInput);
