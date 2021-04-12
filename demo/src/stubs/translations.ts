import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

export const mockTranslations = (opp: MockOpenPeerPower) => {
  opp.mockWS(
    "frontend/get_translations",
    (/* msg: {language: string, category: string} */) => {
      return { resources: {} };
    }
  );
};
