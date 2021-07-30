import { OppEntities } from "openpeerpower-js-websocket";
import {
  applyThemesOnElement,
  invalidateThemeCache,
} from "../common/dom/apply_themes_on_element";
import { computeLocalize } from "../common/translations/localize";
import { DEFAULT_PANEL } from "../data/panel";
import { NumberFormat, TimeFormat } from "../data/translation";
import { translationMetadata } from "../resources/translations-metadata";
import { OpenPeerPower } from "../types";
import { getLocalLanguage, getTranslation } from "../util/opp-translation";
import { demoConfig } from "./demo_config";
import { demoPanels } from "./demo_panels";
import { demoServices } from "./demo_services";
import { Entity, getEntity } from "./entity";

const ensureArray = <T>(val: T | T[]): T[] =>
  Array.isArray(val) ? val : [val];

type MockRestCallback = (
  opp: MockOpenPeerPower,
  method: string,
  path: string,
  parameters: Record<string, any> | undefined
) => any;

export interface MockOpenPeerPower extends OpenPeerPower {
  mockEntities: any;
  updateOpp(obj: Partial<MockOpenPeerPower>);
  updateStates(newStates: OppEntities);
  addEntities(entites: Entity | Entity[], replace?: boolean);
  updateTranslations(fragment: null | string, language?: string);
  addTranslations(translations: Record<string, string>, language?: string);
  mockWS(
    type: string,
    callback: (msg: any, onChange?: (response: any) => void) => any
  );
  mockAPI(path: string | RegExp, callback: MockRestCallback);
  mockEvent(event);
  mockTheme(theme: Record<string, string> | null);
}

export const provideOpp = (
  elements,
  overrideData: Partial<OpenPeerPower> = {}
): MockOpenPeerPower => {
  elements = ensureArray(elements);
  // Can happen because we store sidebar, more info etc on opp.
  const opp = (): MockOpenPeerPower => elements[0].opp;

  const wsCommands = {};
  const restResponses: Array<[string | RegExp, MockRestCallback]> = [];
  const eventListeners: {
    [event: string]: Array<(event) => void>;
  } = {};
  const entities = {};

  async function updateTranslations(
    fragment: null | string,
    language?: string
  ) {
    const lang = language || getLocalLanguage();
    const translation = await getTranslation(fragment, lang);
    await addTranslations(translation.data, lang);
  }

  async function addTranslations(
    translations: Record<string, string>,
    language?: string
  ) {
    const lang = language || getLocalLanguage();
    const resources = {
      [lang]: {
        ...(opp().resources && opp().resources[lang]),
        ...translations,
      },
    };
    opp().updateOpp({
      resources,
    });
    opp().updateOpp({
      localize: await computeLocalize(elements[0], lang, opp().resources),
    });
  }

  function updateStates(newStates: OppEntities) {
    opp().updateOpp({
      states: { ...opp().states, ...newStates },
    });
  }

  function addEntities(newEntities, replace = false) {
    const states = {};
    ensureArray(newEntities).forEach((ent) => {
      ent.opp = opp();
      entities[ent.entityId] = ent;
      states[ent.entityId] = ent.toState();
    });
    if (replace) {
      opp().updateOpp({
        states,
      });
    } else {
      updateStates(states);
    }
  }

  function mockAPI(path, callback) {
    restResponses.push([path, callback]);
  }

  mockAPI(
    new RegExp("states/.+"),
    (
      // @ts-ignore
      method,
      path,
      parameters
    ) => {
      const [domain, objectId] = path.substr(7).split(".", 2);
      if (!domain || !objectId) {
        return;
      }
      addEntities(
        getEntity(domain, objectId, parameters.state, parameters.attributes)
      );
    }
  );

  const localLanguage = getLocalLanguage();
  const noop = () => undefined;

  const hassObj: MockOpenPeerPower = {
    // Open Peer Power properties
    auth: {
      data: {
        oppUrl: "",
      },
    } as any,
    connection: {
      addEventListener: noop,
      removeEventListener: noop,
      sendMessage: (msg) => {
        const callback = wsCommands[msg.type];

        if (callback) {
          callback(msg);
        } else {
          // eslint-disable-next-line
          console.error(`Unknown WS command: ${msg.type}`);
        }
      },
      sendMessagePromise: async (msg) => {
        const callback = wsCommands[msg.type];
        return callback
          ? callback(msg)
          : Promise.reject({
              code: "command_not_mocked",
              message: `WS Command ${msg.type} is not implemented in provide_opp.`,
            });
      },
      subscribeMessage: async (onChange, msg) => {
        const callback = wsCommands[msg.type];
        return callback
          ? callback(msg, onChange)
          : Promise.reject({
              code: "command_not_mocked",
              message: `WS Command ${msg.type} is not implemented in provide_opp.`,
            });
      },
      subscribeEvents: async (
        // @ts-ignore
        callback,
        event
      ) => {
        if (!(event in eventListeners)) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
        return () => {
          eventListeners[event] = eventListeners[event].filter(
            (cb) => cb !== callback
          );
        };
      },
      suspendReconnectUntil: noop,
      suspend: noop,
      socket: {
        readyState: WebSocket.OPEN,
      },
    } as any,
    connected: true,
    states: {},
    config: demoConfig,
    themes: {
      default_theme: "default",
      default_dark_theme: null,
      themes: {},
      darkMode: false,
    },
    panels: demoPanels,
    services: demoServices,
    user: {
      credentials: [],
      id: "abcd",
      is_admin: true,
      is_owner: true,
      mfa_modules: [],
      name: "Demo User",
    },
    panelUrl: "lovelace",
    defaultPanel: DEFAULT_PANEL,
    language: localLanguage,
    selectedLanguage: localLanguage,
    locale: {
      language: localLanguage,
      number_format: NumberFormat.language,
      time_format: TimeFormat.language,
    },
    resources: null as any,
    localize: () => "",

    translationMetadata: translationMetadata as any,
    async loadBackendTranslation() {
      return opp().localize;
    },
    dockedSidebar: "auto",
    vibrate: true,
    suspendWhenHidden: false,
    moreInfoEntityId: null as any,
    // @ts-ignore
    async callService(domain, service, data) {
      if (data && "entity_id" in data) {
        await Promise.all(
          ensureArray(data.entity_id).map((ent) =>
            entities[ent].handleService(domain, service, data)
          )
        );
      } else {
        // eslint-disable-next-line
        console.log("unmocked callService", domain, service, data);
      }
    },
    async callApi(method, path, parameters) {
      const response = restResponses.find(([resPath]) =>
        typeof resPath === "string" ? path === resPath : resPath.test(path)
      );

      return response
        ? response[1](opp(), method, path, parameters)
        : Promise.reject(`API Mock for ${path} is not implemented`);
    },
    oppUrl: (path?) => path,
    fetchWithAuth: () => Promise.reject("Not implemented"),
    sendWS: (msg) => hassObj.connection.sendMessage(msg),
    callWS: (msg) => hassObj.connection.sendMessagePromise(msg),

    // Mock stuff
    mockEntities: entities,
    updateOpp(obj: Partial<MockOpenPeerPower>) {
      const newOpp = { ...opp(), ...obj };
      elements.forEach((el) => {
        el.opp = newOpp;
      });
    },
    updateStates,
    updateTranslations,
    addTranslations,
    addEntities,
    mockWS(type, callback) {
      wsCommands[type] = callback;
    },
    mockAPI,
    mockEvent(event) {
      (eventListeners[event] || []).forEach((fn) => fn(event));
    },
    mockTheme(theme) {
      invalidateThemeCache();
      opp().updateOpp({
        selectedTheme: { theme: theme ? "mock" : "default" },
        themes: {
          ...opp().themes,
          themes: {
            mock: theme as any,
          },
        },
      });
      const { themes, selectedTheme } = opp();
      applyThemesOnElement(
        document.documentElement,
        themes,
        selectedTheme!.theme
      );
    },

    ...overrideData,
  };

  // Update the elements. Note, we call it on hassObj so that if it was
  // overridden (like in the demo), it will still work.
  hassObj.updateOpp(hassObj);

  // @ts-ignore
  return oppObj;
};
