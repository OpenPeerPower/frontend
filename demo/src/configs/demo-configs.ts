import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";
import { Lovelace } from "../../../src/panels/lovelace/types";
import { DemoConfig } from "./types";

export const demoConfigs: Array<() => Promise<DemoConfig>> = [
  () => import("./arsaboo").then((mod) => mod.demoArsaboo),
  () => import("./teachingbirds").then((mod) => mod.demoTeachingbirds),
  () => import("./kernehed").then((mod) => mod.demoKernehed),
  () => import("./jimpower").then((mod) => mod.demoJimpower),
];

// eslint-disable-next-line import/no-mutable-exports
export let selectedDemoConfigIndex = 0;
// eslint-disable-next-line import/no-mutable-exports
export let selectedDemoConfig: Promise<DemoConfig> =
  demoConfigs[selectedDemoConfigIndex]();

export const setDemoConfig = async (
  opp: MockOpenPeerPower,
  lovelace: Lovelace,
  index: number
) => {
  const confProm = demoConfigs[index]();
  const config = await confProm;

  selectedDemoConfigIndex = index;
  selectedDemoConfig = confProm;

  opp.addEntities(config.entities(opp.localize), true);
  lovelace.saveConfig(config.lovelace(opp.localize));
  opp.mockTheme(config.theme());
};
