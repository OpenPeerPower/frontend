import "@polymer/iron-flex-layout/iron-flex-layout-classes";
import "@polymer/iron-label/iron-label";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import { isComponentLoaded } from "../../common/config/is_component_loaded";
import { pushSupported } from "../../components/ha-push-notifications-toggle";
import "../../components/ha-settings-row";
import LocalizeMixin from "../../mixins/localize-mixin";
import { documentationUrl } from "../../util/documentation-url";

/*
 * @appliesMixin LocalizeMixin
 */
class HaPushNotificationsRow extends LocalizeMixin(PolymerElement) {
  static get template() {
    return html`
      <style>
        a {
          color: var(--primary-color);
        }
      </style>
      <op-settings-row narrow="[[narrow]]">
        <span slot="heading"
          >[[localize('ui.panel.profile.push_notifications.header')]]</span
        >
        <span slot="description">
          [[localize(_descrLocalizeKey)]]
          <a
            href="[[_computeDocumentationUrl(opp)]]"
            target="_blank"
            rel="noreferrer"
            >[[localize('ui.panel.profile.push_notifications.link_promo')]]</a
          >
        </span>
        <op-push-notifications-toggle
          opp="[[opp]]"
          disabled="[[_error]]"
        ></op-push-notifications-toggle>
      </op-settings-row>
    `;
  }

  static get properties() {
    return {
      opp: Object,
      narrow: Boolean,
      _descrLocalizeKey: {
        type: String,
        computed: "_descriptionKey(_platformLoaded, _pushSupported)",
      },
      _platformLoaded: {
        type: Boolean,
        computed: "_compPlatformLoaded(opp)",
      },
      _pushSupported: {
        type: Boolean,
        value: pushSupported,
      },
      _error: {
        type: Boolean,
        computed: "_compError(_platformLoaded, _pushSupported)",
      },
    };
  }

  _computeDocumentationUrl(opp) {
    return documentationUrl(opp, "/integrations/html5");
  }

  _compPlatformLoaded(opp) {
    return isComponentLoaded(opp, "notify.html5");
  }

  _compError(platformLoaded, pushSupported_) {
    return !platformLoaded || !pushSupported_;
  }

  _descriptionKey(platformLoaded, pushSupported_) {
    let key;
    if (!pushSupported_) {
      key = "error_use_https";
    } else if (!platformLoaded) {
      key = "error_load_platform";
    } else {
      key = "description";
    }
    return `ui.panel.profile.push_notifications.${key}`;
  }
}

customElements.define("ha-push-notifications-row", HaPushNotificationsRow);
