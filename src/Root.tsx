import App from "./App.tsx";
import schemaContent from "./schemas/main2.sql?raw";
import { DBProvider } from "@vlcn.io/react";
import { useEffect, useState } from "react";
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'
import { SearchProvider } from "~/features/search";
import { DatabaseProvider } from '~/context/database-context'
import { AppStateProvider } from "~/features/app-state";

/**
 * Generates a random room name to sync with or pulls one from local storage.
 */
function getRoom(hash: HashBag): string {
  return hash.room || localStorage.getItem("room") || newRoom();
}

function hashChanged() {
  const hash = parseHash();
  const room = getRoom(hash);
  if (room != hash.room) {
    hash.room = room;
    window.location.hash = writeHash(hash);
  }
  localStorage.setItem("room", room);
  return room;
}
const room = hashChanged();

export default function Root() {
  const [theRoom, setTheRoom] = useState(room);
  useEffect(() => {
    const cb = () => {
      const room = hashChanged();
      if (room != theRoom) {
        setTheRoom(room);
      }
    };
    addEventListener("hashchange", cb);
    return () => {
      removeEventListener("hashchange", cb);
    };
  }, []); // ignore -- theRoom is managed by the effect

  return (
    <DBProvider
      dbname={theRoom}
      schema={{
        name: "main2.sql",
        content: schemaContent,
      }}
      Render={() => (
        <DatabaseProvider dbName={theRoom}>
          <AppStateProvider>
            <SearchProvider>
              <ProsemirrorAdapterProvider>
                <App dbname={theRoom} />
              </ProsemirrorAdapterProvider>
            </SearchProvider>
          </AppStateProvider>
        </DatabaseProvider>
      )}
    />
  );
}

type HashBag = { [key: string]: string };
function parseHash(): HashBag {
  const hash = window.location.hash;
  const ret: { [key: string]: string } = {};
  if (hash.length > 1) {
    const substr = hash.substring(1);
    const parts = substr.split(",");
    for (const part of parts) {
      const [key, value] = part.split("=");
      ret[key] = value;
    }
  }

  return ret;
}

function writeHash(hash: HashBag) {
  const parts = [];
  for (const key in hash) {
    parts.push(`${key}=${hash[key]}`);
  }
  return parts.join(",");
}

function newRoom() {
  return crypto.randomUUID().replaceAll("-", "");
}
