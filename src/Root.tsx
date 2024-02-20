import { useEffect, useState } from "react";
import { DBProvider } from "@vlcn.io/react";
import { NextUIProvider } from "@nextui-org/react";

import App from "./App.tsx";
import schemaContent from "./schemas/main2.sql?raw";
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'
import { SearchProvider } from "~/features/search";
import { AppStateProvider } from "~/features/app-state";
import { queryManager, loadWasmDatabase, QueryManagerProvider } from '~/query-manager.ts'
import { RootServiceProvider, rootService } from "./services/root.service.tsx";
import { nanoid } from 'nanoid'

// queryManager.onLoaded(() => {
//   rootService.load()
// })
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

  useEffect(() => {
    if (theRoom) {
      loadWasmDatabase(theRoom).then((db) => {
        queryManager.applyDb(db)
      })
    }
  }, [theRoom])

  return (
    <DBProvider
      dbname={theRoom}
      schema={{
        name: "main2.sql",
        content: schemaContent,
      }}
      Render={() => {
        rootService.load()

        return (
          <QueryManagerProvider>
            <RootServiceProvider>
              <NextUIProvider>
                <AppStateProvider>
                  <SearchProvider>
                    <App dbname={theRoom} />
                  </SearchProvider>
                </AppStateProvider>
              </NextUIProvider>
            </RootServiceProvider>
          </QueryManagerProvider>
      )}}
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
  return nanoid()
}
