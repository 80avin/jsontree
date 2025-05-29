import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper function to update URL with current settings
const updateUrlWithSettings = async () => {
  try {
    const { createShareableUrl } = await import("@/store/useSavedJsons");
    const enhancedUrl = await createShareableUrl(true);
    window.history.replaceState({}, "", enhancedUrl);
  } catch (error) {
    // Silently fail - URL update is not critical
    // eslint-disable-next-line no-console
    console.warn("Failed to update URL with settings:", error);
  }
};

export interface FilterState {
  pattern: string;
  isWhitelist: boolean;
  isActive: boolean;
  compiledRegex: RegExp | null;
  isValid: boolean;
  errorMessage: string;
}

interface FilterActions {
  setFilter: (pattern: string, isWhitelist: boolean) => void;
  clearFilter: () => void;
  shouldIncludePath: (path: string) => boolean;
  validatePattern: (pattern: string) => boolean;
}

const initialState: FilterState = {
  pattern: "",
  isWhitelist: true,
  isActive: false,
  compiledRegex: null,
  isValid: true,
  errorMessage: "",
};

export const useFilter = create<FilterState & FilterActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFilter: (pattern: string, isWhitelist: boolean) => {
        const trimmedPattern = pattern.trim();

        if (!trimmedPattern) {
          set({
            pattern: "",
            isWhitelist,
            isActive: false,
            compiledRegex: null,
            isValid: true,
            errorMessage: "",
          });
          // Update URL after clearing filter
          updateUrlWithSettings();
          return;
        }

        try {
          const compiledRegex = new RegExp(trimmedPattern);
          set({
            pattern: trimmedPattern,
            isWhitelist,
            isActive: true,
            compiledRegex,
            isValid: true,
            errorMessage: "",
          });
          // Update URL after setting filter
          updateUrlWithSettings();
        } catch (error) {
          set({
            pattern: trimmedPattern,
            isWhitelist,
            isActive: false,
            compiledRegex: null,
            isValid: false,
            errorMessage:
              error instanceof Error ? error.message : "Invalid regex",
          });
          // Don't update URL for invalid patterns
        }
      },

      clearFilter: () => {
        set({
          ...initialState,
        });
        // Update URL after clearing filter
        updateUrlWithSettings();
      },

      shouldIncludePath: (path: string) => {
        const { compiledRegex, isWhitelist, isActive } = get();

        if (!isActive || !compiledRegex) {
          return true;
        }

        const matches = compiledRegex.test(path);
        return isWhitelist ? matches : !matches;
      },

      validatePattern: (pattern: string) => {
        if (!pattern.trim()) {
          return true;
        }

        try {
          new RegExp(pattern);
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "jsontree-filter",
      partialize: (state) => ({
        pattern: state.pattern,
        isWhitelist: state.isWhitelist,
        isActive: state.isActive,
      }),
    },
  ),
);
