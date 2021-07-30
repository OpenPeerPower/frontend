import "@polymer/iron-flex-layout/iron-flex-layout-classes";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import { attributeClassNames } from "../../../common/entity/attribute_class_names";
import { featureClassNames } from "../../../common/entity/feature_class_names";
import "../../../components/ha-cover-tilt-controls";
import "../../../components/op-labeled-slider";
import LocalizeMixin from "../../../mixins/localize-mixin";
import CoverEntity from "../../../util/cover-model";

const FEATURE_CLASS_NAMES = {
  4: "has-set_position",
  128: "has-set_tilt_position",
};
class MoreInfoCover extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="iron-flex"></style>
      <style>
        .current_position,
        .tilt {
          max-height: 0px;
          overflow: hidden;
        }

        .has-set_position .current_position,
        .has-current_position .current_position,
        .has-set_tilt_position .tilt,
        .has-current_tilt_position .tilt {
          max-height: 208px;
        }

        [invisible] {
          visibility: hidden !important;
        }
      </style>
      <div class$="[[computeClassNames(stateObj)]]">
        <div class="current_position">
          <op-labeled-slider
            caption="[[localize('ui.card.cover.position')]]"
            pin=""
            value="{{coverPositionSliderValue}}"
            disabled="[[!entityObj.supportsSetPosition]]"
            on-change="coverPositionSliderChanged"
          ></op-labeled-slider>
        </div>

        <div class="tilt">
          <op-labeled-slider
            caption="[[localize('ui.card.cover.tilt_position')]]"
            pin=""
            extra=""
            value="{{coverTiltPositionSliderValue}}"
            disabled="[[!entityObj.supportsSetTiltPosition]]"
            on-change="coverTiltPositionSliderChanged"
          >
            <op-cover-tilt-controls
              slot="extra"
              hidden$="[[entityObj.isTiltOnly]]"
              opp="[[opp]]"
              state-obj="[[stateObj]]"
            ></op-cover-tilt-controls>
          </op-labeled-slider>
        </div>
      </div>
      <op-attributes
        opp="[[opp]]"
        state-obj="[[stateObj]]"
        extra-filters="current_position,current_tilt_position"
      ></op-attributes>
    `;
  }

  static get properties() {
    return {
      opp: Object,
      stateObj: {
        type: Object,
        observer: "stateObjChanged",
      },
      entityObj: {
        type: Object,
        computed: "computeEntityObj(opp, stateObj)",
      },
      coverPositionSliderValue: Number,
      coverTiltPositionSliderValue: Number,
    };
  }

  computeEntityObj(opp, stateObj) {
    return new CoverEntity(opp, stateObj);
  }

  stateObjChanged(newVal) {
    if (newVal) {
      this.setProperties({
        coverPositionSliderValue: newVal.attributes.current_position,
        coverTiltPositionSliderValue: newVal.attributes.current_tilt_position,
      });
    }
  }

  computeClassNames(stateObj) {
    const classes = [
      attributeClassNames(stateObj, [
        "current_position",
        "current_tilt_position",
      ]),
      featureClassNames(stateObj, FEATURE_CLASS_NAMES),
    ];
    return classes.join(" ");
  }

  coverPositionSliderChanged(ev) {
    this.entityObj.setCoverPosition(ev.target.value);
  }

  coverTiltPositionSliderChanged(ev) {
    this.entityObj.setCoverTiltPosition(ev.target.value);
  }
}

customElements.define("more-info-cover", MoreInfoCover);
