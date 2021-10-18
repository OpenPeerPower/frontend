import "@polymer/app-layout/app-header-layout/app-header-layout";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-item/paper-item-body";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../src/components/op-card";
import "../../src/components/op-icon";
import "../../src/components/op-icon-button";
import "../../src/managers/notification-manager";
import "../../src/styles/polymer-op-style";
// eslint-disable-next-line import/extensions
import { DEMOS } from "../build/import-demos";

class HaGallery extends PolymerElement {
  static get template() {
    return html`
      <style include="iron-positioning op-style">
        :host {
          -ms-user-select: initial;
          -webkit-user-select: initial;
          -moz-user-select: initial;
        }
        app-header-layout {
          min-height: 100vh;
        }
        op-icon-button.invisible {
          visibility: hidden;
        }

        .pickers {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: start;
        }

        .pickers op-card {
          width: 400px;
          display: block;
          margin: 16px 8px;
        }

        .pickers op-card:last-child {
          margin-bottom: 16px;
        }

        .intro {
          margin: -1em 0;
        }

        p a {
          color: var(--primary-color);
        }

        a {
          color: var(--primary-text-color);
          text-decoration: none;
        }
      </style>

      <app-header-layout>
        <app-header slot="header" fixed>
          <app-toolbar>
            <op-icon-button
              icon="opp:arrow-left"
              on-click="_backTapped"
              class$="[[_computeHeaderButtonClass(_demo)]]"
            ></op-icon-button>
            <div main-title>
              [[_withDefault(_demo, "Open Peer Power Gallery")]]
            </div>
          </app-toolbar>
        </app-header>

        <div class="content">
          <div id="demo"></div>
          <template is="dom-if" if="[[!_demo]]">
            <div class="pickers">
              <op-card header="Lovelace Card Demos">
                <div class="card-content intro">
                  <p>
                    Lovelace has many different cards. Each card allows the user
                    to tell a different story about what is going on in their
                    house. These cards are very customizable, as no household is
                    the same.
                  </p>

                  <p>
                    This gallery helps our developers and designers to see all
                    the different states that each card can be in.
                  </p>

                  <p>
                    Check
                    <a href="https://www.openpeerpower.io/lovelace"
                      >the official website</a
                    >
                    for instructions on how to get started with Lovelace.
                  </p>
                </div>
                <template is="dom-repeat" items="[[_lovelaceDemos]]">
                  <a href="#[[item]]">
                    <paper-item>
                      <paper-item-body>{{ item }}</paper-item-body>
                      <op-icon icon="opp:chevron-right"></op-icon>
                    </paper-item>
                  </a>
                </template>
              </op-card>

              <op-card header="Other Demos">
                <div class="card-content intro"></div>
                <template is="dom-repeat" items="[[_restDemos]]">
                  <a href="#[[item]]">
                    <paper-item>
                      <paper-item-body>{{ item }}</paper-item-body>
                      <op-icon icon="opp:chevron-right"></op-icon>
                    </paper-item>
                  </a>
                </template>
              </op-card>
            </div>
          </template>
        </div>
      </app-header-layout>
      <notification-manager
        opp="[[_fakeOpp]]"
        id="notifications"
      ></notification-manager>
    `;
  }

  static get properties() {
    return {
      _fakeOpp: {
        type: Object,
        // Just enough for computeRTL
        value: {
          language: "en",
          translationMetadata: {
            translations: {},
          },
        },
      },
      _demo: {
        type: String,
        value: document.location.hash.substr(1),
        observer: "_demoChanged",
      },
      _demos: {
        type: Array,
        value: Object.keys(DEMOS),
      },
      _lovelaceDemos: {
        type: Array,
        computed: "_computeLovelace(_demos)",
      },
      _restDemos: {
        type: Array,
        computed: "_computeRest(_demos)",
      },
    };
  }

  ready() {
    super.ready();

    this.addEventListener("show-notification", (ev) =>
      this.$.notifications.showDialog({ message: ev.detail.message })
    );

    this.addEventListener("opp-more-info", (ev) => {
      if (ev.detail.entityId) {
        this.$.notifications.showDialog({
          message: `Showing more info for ${ev.detail.entityId}`,
        });
      }
    });

    window.addEventListener("hashchange", () => {
      this._demo = document.location.hash.substr(1);
    });
  }

  _withDefault(value, def) {
    return value || def;
  }

  _demoChanged(demo) {
    const root = this.$.demo;

    while (root.lastChild) root.removeChild(root.lastChild);

    if (demo) {
      DEMOS[demo]();
      const el = document.createElement(demo);
      root.appendChild(el);
    }
  }

  _computeHeaderButtonClass(demo) {
    return demo ? "" : "invisible";
  }

  _backTapped() {
    document.location.hash = "";
  }

  _computeLovelace(demos) {
    return demos.filter((demo) => demo.includes("hui"));
  }

  _computeRest(demos) {
    return demos.filter((demo) => !demo.includes("hui"));
  }
}

customElements.define("op-gallery", HaGallery);
