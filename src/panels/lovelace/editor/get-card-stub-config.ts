import { LovelaceCardConfig } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { getCardElementClass } from "../create-element/create-card-element";

export const getCardStubConfig = async (
  opp: OpenPeerPower,
  type: string,
  entities: string[],
  entitiesFallback: string[]
): Promise<LovelaceCardConfig> => {
  let cardConfig: LovelaceCardConfig = { type };

  const elClass = await getCardElementClass(type);

  if (elClass && elClass.getStubConfig) {
    const classStubConfig = elClass.getStubConfig(
      opp,
      entities,
      entitiesFallback
    );

    cardConfig = { ...cardConfig, ...classStubConfig };
  }

  return cardConfig;
};
