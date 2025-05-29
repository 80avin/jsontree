import { create } from "zustand";
import debounce from "lodash.debounce";
import { contentToJson } from "@/core/json/jsonAdapter";
import { useJson } from "@/store/useJson";
import { useStored } from "@/store/useStored";
import { JSON_TEMPLATE } from "@/constants/json";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

type SetContents = {
  contents?: string;
  hasChanges?: boolean;
  skipUpdate?: boolean;
};

interface JsonActions {
  getContents: () => string;
  getHasChanges: () => boolean;
  setError: (error: object | null | string) => void;
  setHasChanges: (hasChanges: boolean) => void;
  loadInitialContent: () => void;
  setContents: (data: SetContents) => void;
  clear: () => void;
}

const initialStates = {
  contents: JSON_TEMPLATE,
  error: null as any,
  hasChanges: false,
};

export type FileStates = typeof initialStates;

const debouncedUpdateJson = debounce((value: unknown) => {
  const url = new URL(window.location.href);
  const json = JSON.stringify(value, null, 2);
  url.hash = "#" + compressToEncodedURIComponent(json);
  window.location.replace(url);
  return useJson.getState().setJson(json);
}, 800);

export const useApp = create<FileStates & JsonActions>()((set, get) => ({
  ...initialStates,
  clear: () => {
    set({ contents: "" });
    useJson.getState().clear();
  },
  getContents: () => get().contents,
  getHasChanges: () => get().hasChanges,
  loadInitialContent: () => {
    const hash = window.location.hash;
    let contents: string = "";
    if (hash.length > 1) {
      try {
        const jsonText = decompressFromEncodedURIComponent(
          decodeURIComponent(hash.substring(1)),
        );
        if (jsonText) JSON.parse(jsonText);
        contents = jsonText;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Invalid JSON in URL hash", error);
      }
    }

    contents = contents || useJson.getState().json || JSON_TEMPLATE;
    get().setContents({ contents, hasChanges: false });
  },
  setContents: async ({ contents, hasChanges = true, skipUpdate = false }) => {
    try {
      set({ ...(contents && { contents }), error: null, hasChanges });
      const json = await contentToJson(get().contents);
      if (!useStored.getState().liveTransform && skipUpdate) return;

      debouncedUpdateJson(json);
    } catch (error: any) {
      if (error?.mark?.snippet) return set({ error: error.mark.snippet });
      if (error?.message) set({ error: error.message });
    }
  },
  setError: (error) => set({ error }),
  setHasChanges: (hasChanges) => set({ hasChanges }),
}));
