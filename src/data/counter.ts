import { OpenPeerPower } from "../types";

export interface Counter {
  id: string;
  name: string;
  icon?: string;
  initial?: number;
  restore?: boolean;
  minimum?: number;
  maximum?: number;
  step?: number;
}

export interface CounterMutableParams {
  name: string;
  icon: string;
  initial: number;
  restore: boolean;
  minimum: number;
  maximum: number;
  step: number;
}

export const fetchCounter = (opp: OpenPeerPower) =>
  opp.callWS<Counter[]>({ type: "counter/list" });

export const createCounter = (
  opp: OpenPeerPower,
  values: CounterMutableParams
) =>
  opp.callWS<Counter>({
    type: "counter/create",
    ...values,
  });

export const updateCounter = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<CounterMutableParams>
) =>
  opp.callWS<Counter>({
    type: "counter/update",
    counter_id: id,
    ...updates,
  });

export const deleteCounter = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "counter/delete",
    counter_id: id,
  });
