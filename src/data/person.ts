import { OpenPeerPower } from "../types";

export interface Person {
  id: string;
  name: string;
  user_id?: string;
  device_trackers?: string[];
  picture?: string;
}

export interface PersonMutableParams {
  name: string;
  user_id: string | null;
  device_trackers: string[];
  picture: string | null;
}

export const fetchPersons = (opp: OpenPeerPower) =>
  opp.callWS<{
    storage: Person[];
    config: Person[];
  }>({ type: "person/list" });

export const createPerson = (
  opp: OpenPeerPower,
  values: PersonMutableParams
) =>
  opp.callWS<Person>({
    type: "person/create",
    ...values,
  });

export const updatePerson = (
  opp: OpenPeerPower,
  personId: string,
  updates: Partial<PersonMutableParams>
) =>
  opp.callWS<Person>({
    type: "person/update",
    person_id: personId,
    ...updates,
  });

export const deletePerson = (opp: OpenPeerPower, personId: string) =>
  opp.callWS({
    type: "person/delete",
    person_id: personId,
  });
