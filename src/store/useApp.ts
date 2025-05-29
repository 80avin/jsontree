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
  loadInitialContent: () => Promise<void>;
  setContents: (data: SetContents) => void;
  clear: () => void;
}

const initialStates = {
  contents: JSON_TEMPLATE,
  error: null as any,
  hasChanges: false,
};

export type FileStates = typeof initialStates;

const debouncedUpdateJson = debounce(async (value: unknown) => {
  const json = JSON.stringify(value, null, 2);

  try {
    // Try to create enhanced URL with settings
    const { createShareableUrl } = await import("@/store/useSavedJsons");

    // First update the JSON state
    useJson.getState().setJson(json);

    // Then create the enhanced URL
    const enhancedUrl = await createShareableUrl(true);
    window.location.replace(enhancedUrl);
  } catch (error) {
    // Fallback to simple URL update
    const url = new URL(window.location.href);
    url.hash = "#" + compressToEncodedURIComponent(json);
    window.location.replace(url);
    useJson.getState().setJson(json);
  }
}, 800);

export const useApp = create<FileStates & JsonActions>()((set, get) => ({
  ...initialStates,
  clear: () => {
    set({ contents: "" });
    useJson.getState().clear();
  },
  getContents: () => get().contents,
  getHasChanges: () => get().hasChanges,
  loadInitialContent: async () => {
    const hash = window.location.hash;
    let contents: string = "";

    if (hash.length > 1) {
      try {
        // Try loading with enhanced URL loading (includes settings)
        const { loadFromShareableUrl } = await import("@/store/useSavedJsons");
        await loadFromShareableUrl(hash);

        // Get the loaded JSON content
        contents = useJson.getState().json;
      } catch (error) {
        // Fallback to old URL loading method
        try {
          const jsonText = decompressFromEncodedURIComponent(
            decodeURIComponent(hash.substring(1)),
          );
          if (jsonText) JSON.parse(jsonText);
          contents = jsonText;
        } catch (fallbackError) {
          // eslint-disable-next-line no-console
          console.error("Invalid JSON in URL hash", fallbackError);
        }
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
