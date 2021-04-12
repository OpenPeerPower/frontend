import { OpenPeerPower } from "../../../../types";
import { getHeaderFooterElementClass } from "../../create-element/create-header-footer-element";
import { LovelaceHeaderFooterConfig } from "../../header-footer/types";

export const getHeaderFooterStubConfig = async (
  opp: OpenPeerPower,
  type: string,
  entities: string[],
  entitiesFallback: string[]
): Promise<LovelaceHeaderFooterConfig> => {
  let config: LovelaceHeaderFooterConfig = { type };

  const elClass = await getHeaderFooterElementClass(type);

  if (elClass && elClass.getStubConfig) {
    const classStubConfig = elClass.getStubConfig(
      opp,
      entities,
      entitiesFallback
    );

    config = { ...config, ...classStubConfig };
  }

  return config;
};
