import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        }
      },

      clearFilter: () => {
        set({
          ...initialState,
        });
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
