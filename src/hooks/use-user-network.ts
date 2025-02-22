import { useMemo } from "react";
import { Kind } from "nostr-tools";

import { getPubkeysFromList } from "../helpers/nostr/lists";
import useUserContactList from "./use-user-contact-list";
import replaceableEventLoaderService from "../services/replaceable-event-requester";
import { useReadRelayUrls } from "./use-client-relays";
import useSubjects from "./use-subjects";
import userMetadataService from "../services/user-metadata";
import { Kind0ParsedContent } from "../helpers/user-metadata";

export function useUsersMetadata(pubkeys: string[], additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const metadataSubjects = useMemo(() => {
    return pubkeys.map((pubkey) => userMetadataService.requestMetadata(pubkey, readRelays));
  }, [pubkeys]);
  const metadataArray = useSubjects(metadataSubjects);
  const metadataDir = useMemo(() => {
    const dir: Record<string, Kind0ParsedContent> = {};
    for (const metadata of metadataArray) {
      if (!metadata.pubkey) continue;
      dir[metadata.pubkey] = metadata;
    }
    return dir;
  }, [metadataArray]);

  return metadataDir;
}

export default function useUserNetwork(pubkey: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const contacts = useUserContactList(pubkey);
  const contactsPubkeys = contacts ? getPubkeysFromList(contacts) : [];

  const subjects = useMemo(() => {
    return contactsPubkeys.map((person) =>
      replaceableEventLoaderService.requestEvent(readRelays, Kind.Contacts, person.pubkey),
    );
  }, [contactsPubkeys, readRelays.join("|")]);

  const lists = useSubjects(subjects);
  const metadata = useUsersMetadata(lists.map((list) => list.pubkey).concat(pubkey));

  return { lists, contacts, metadata };
}

export function useNetworkConnectionCount(pubkey: string, additionalRelays: string[] = []) {
  const { lists, contacts } = useUserNetwork(pubkey, additionalRelays);
  const contactsPubkeys = contacts ? getPubkeysFromList(contacts) : [];

  return useMemo(() => {
    const pubkeys = new Map<string, number>();
    for (const list of lists) {
      const keys = getPubkeysFromList(list);
      for (const { pubkey } of keys) {
        pubkeys.set(pubkey, (pubkeys.get(pubkey) ?? 0) + 1);
      }
    }
    for (const { pubkey } of contactsPubkeys) pubkeys.delete(pubkey);
    return Array.from(pubkeys)
      .sort((a, b) => b[1] - a[1])
      .map((a) => ({ pubkey: a[0], count: a[1] }));
  }, [lists, contactsPubkeys]);
}
