import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { CanvasDirection } from "reaflow/dist/layout/elkLayout";

export interface SavedJsonState {
  id: string;
  name: string;
  json: string;
  filter: {
    pattern: string;
    isWhitelist: boolean;
    isActive: boolean;
  };
  tree: {
    direction: CanvasDirection;
    foldNodes: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

interface SavedJsonsState {
  savedJsons: SavedJsonState[];
}

interface SavedJsonsActions {
  saveJson: (name: string) => Promise<void>;
  loadJson: (id: string) => Promise<void>;
  deleteJson: (id: string) => void;
  updateJsonName: (id: string, newName: string) => void;
  getSavedJson: (id: string) => SavedJsonState | undefined;
  exportSavedJsons: () => string;
  importSavedJsons: (data: string) => Promise<void>;
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useSavedJsons = create<SavedJsonsState & SavedJsonsActions>()(
  persist(
    (set, get) => ({
      savedJsons: [],

      saveJson: async (name: string) => {
        try {
          // Import stores dynamically to avoid circular dependencies
          const { useJson } = await import("@/store/useJson");
          const { useFilter } = await import("@/store/useFilter");
          const { useTree } = await import("@/store/useTree");

          const jsonState = useJson.getState();
          const filterState = useFilter.getState();
          const treeState = useTree.getState();

          const savedJson: SavedJsonState = {
            id: generateId(),
            name: name.trim() || `Untitled ${Date.now()}`,
            json: jsonState.json,
            filter: {
              pattern: filterState.pattern,
              isWhitelist: filterState.isWhitelist,
              isActive: filterState.isActive,
            },
            tree: {
              direction: treeState.direction,
              foldNodes: treeState.foldNodes,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            savedJsons: [...state.savedJsons, savedJson],
          }));

          return Promise.resolve();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to save JSON:", error);
          return Promise.reject(error);
        }
      },

      loadJson: async (id: string) => {
        try {
          const savedJson = get().getSavedJson(id);
          if (!savedJson) {
            throw new Error("Saved JSON not found");
          }

          // Import stores dynamically
          const { useJson } = await import("@/store/useJson");
          const { useFilter } = await import("@/store/useFilter");
          const { useTree } = await import("@/store/useTree");
          const { useApp } = await import("@/store/useApp");

          // Load filter settings first (before JSON to avoid triggering with wrong filter)
          useFilter
            .getState()
            .setFilter(savedJson.filter.pattern, savedJson.filter.isWhitelist);

          // Load tree settings
          useTree.getState().setDirection(savedJson.tree.direction);
          useTree.getState().toggleFold(savedJson.tree.foldNodes);

          // Update editor content (this will trigger JSON store update and URL update)
          useApp.getState().setContents({
            contents: savedJson.json,
            hasChanges: false,
            skipUpdate: false,
          });

          // Force regenerate the graph with new settings
          setTimeout(() => {
            useTree.getState().setGraph();
          }, 100);

          return Promise.resolve();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to load JSON:", error);
          return Promise.reject(error);
        }
      },

      deleteJson: (id: string) => {
        set((state) => ({
          savedJsons: state.savedJsons.filter((json) => json.id !== id),
        }));
      },

      updateJsonName: (id: string, newName: string) => {
        set((state) => ({
          savedJsons: state.savedJsons.map((json) =>
            json.id === id
              ? {
                  ...json,
                  name: newName.trim() || json.name,
                  updatedAt: Date.now(),
                }
              : json,
          ),
        }));
      },

      getSavedJson: (id: string) => {
        return get().savedJsons.find((json) => json.id === id);
      },

      exportSavedJsons: () => {
        const data = {
          version: "1.0",
          exportedAt: Date.now(),
          savedJsons: get().savedJsons,
        };
        return JSON.stringify(data, null, 2);
      },

      importSavedJsons: async (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.savedJsons || !Array.isArray(parsed.savedJsons)) {
            throw new Error("Invalid export format");
          }

          // Validate and sanitize imported data
          const validSavedJsons = parsed.savedJsons.filter((item: any) => {
            return (
              item &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.json === "string" &&
              item.filter &&
              item.tree
            );
          });

          set((state) => ({
            savedJsons: [...state.savedJsons, ...validSavedJsons],
          }));

          return Promise.resolve();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to import saved JSONs:", error);
          return Promise.reject(error);
        }
      },
    }),
    {
      name: "jsontree-saved-jsons",
      version: 1,
    },
  ),
);

// Enhanced share functionality with settings
export interface ShareableState {
  json: string;
  filter?: {
    pattern: string;
    isWhitelist: boolean;
    isActive: boolean;
  };
  tree?: {
    direction: CanvasDirection;
    foldNodes: boolean;
  };
}

export const createShareableUrl = async (
  includeSettings = true,
): Promise<string> => {
  try {
    const { useJson } = await import("@/store/useJson");
    const { useFilter } = await import("@/store/useFilter");
    const { useTree } = await import("@/store/useTree");

    const jsonState = useJson.getState();

    const shareableState: ShareableState = {
      json: jsonState.json,
    };

    if (includeSettings) {
      const filterState = useFilter.getState();
      const treeState = useTree.getState();

      shareableState.filter = {
        pattern: filterState.pattern,
        isWhitelist: filterState.isWhitelist,
        isActive: filterState.isActive,
      };

      shareableState.tree = {
        direction: treeState.direction,
        foldNodes: treeState.foldNodes,
      };
    }

    const url = new URL(window.location.href);
    url.hash =
      "#" + compressToEncodedURIComponent(JSON.stringify(shareableState));

    return url.toString();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create shareable URL:", error);
    throw error;
  }
};

export const loadFromShareableUrl = async (urlHash: string): Promise<void> => {
  try {
    if (!urlHash || urlHash.length <= 1) return;

    const compressed = urlHash.substring(1);
    const decompressed = decompressFromEncodedURIComponent(
      decodeURIComponent(compressed),
    );

    if (!decompressed) return;

    let shareableState: ShareableState;

    try {
      // Try parsing as new format with settings
      shareableState = JSON.parse(decompressed);

      // Validate structure
      if (typeof shareableState !== "object" || !shareableState.json) {
        // Fallback to treating as plain JSON string
        shareableState = { json: decompressed };
      }
    } catch {
      // Fallback to treating as plain JSON string
      shareableState = { json: decompressed };
    }

    // Import stores
    const { useJson } = await import("@/store/useJson");
    const { useFilter } = await import("@/store/useFilter");
    const { useTree } = await import("@/store/useTree");
    const { useApp } = await import("@/store/useApp");

    // Load filter settings first (if available)
    if (shareableState.filter) {
      useFilter
        .getState()
        .setFilter(
          shareableState.filter.pattern,
          shareableState.filter.isWhitelist,
        );
    }

    // Load tree settings (if available)
    if (shareableState.tree) {
      useTree.getState().setDirection(shareableState.tree.direction);
      useTree.getState().toggleFold(shareableState.tree.foldNodes);
    }

    // Load JSON - this will be handled by the App store's loadInitialContent
    // We just set it in the JSON store for now
    useJson.getState().setJson(shareableState.json);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load from shareable URL:", error);
    // Don't throw - just log the error and continue with default state
  }
};
