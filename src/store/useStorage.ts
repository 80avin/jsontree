import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useTree } from "@/store/useTree";
import { useJson } from "./useJson";

type StorageActions = {
  getActiveFile: () => { name: string; contents: string };
  getFiles: () => Record<"name" | "contents", string>[];
  saveFile: (doc: { name?: string; contents?: string }) => void;

  clear: () => void;
};

const initialState = {
  activeFileName: "undefined",
  files: [] as Record<"name" | "contents", string>[],
};

export type StorageState = typeof initialState;

export const useStorage = create<StorageState & StorageActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      getActiveFile: () => {
        const activeFileName = get().activeFileName;
        return (
          get().files.find((doc) => doc.name === activeFileName) || {
            name: "",
            contents: "",
          }
        );
      },
      getFiles: () => get().files,
      saveFile: ({ name = undefined, contents = undefined } = {}) => {
        set({
          files: [
            {
              name: name ?? get().activeFileName,
              contents: contents ?? useJson.getState().getJson(),
            },
            ...get().files.filter((doc) => doc.name !== name),
          ],
        });
      },
      clear: () => {
        set({ activeFileName: "", files: [] });
        useTree.getState().clearGraph();
      },
    }),
    {
      name: "file-storage",
      storage: createJSONStorage(() => window.localStorage),
    },
  ),
);
