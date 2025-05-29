import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  CancelIcon,
  CheckIcon,
  ErrorIcon,
  ChevronDownIcon,
  FilterIcon,
} from "@/components/Icons";
import { useFilter } from "@/store/useFilter";
import { useTree } from "@/store/useTree";
import { classNames } from "@/utility/classNames";

export function FilterToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState("");
  const [tempIsWhitelist, setTempIsWhitelist] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    pattern,
    isWhitelist,
    isActive,
    setFilter,
    clearFilter,
    validatePattern,
  } = useFilter();

  const { setGraph } = useTree();

  // Initialize temp values when component mounts or filter changes
  useEffect(() => {
    setTempPattern(pattern);
    setTempIsWhitelist(isWhitelist);
  }, [pattern, isWhitelist]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handlePatternChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPattern = e.target.value;
      setTempPattern(newPattern);
    },
    [],
  );

  const handleFilterTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTempIsWhitelist(e.target.value === "whitelist");
    },
    [],
  );

  const applyFilter = useCallback(() => {
    if (validatePattern(tempPattern)) {
      setFilter(tempPattern, tempIsWhitelist);
      setGraph(); // Trigger re-rendering of the graph
      setIsOpen(false);
    }
  }, [tempPattern, tempIsWhitelist, setFilter, setGraph, validatePattern]);

  const handleClearFilter = useCallback(() => {
    clearFilter();
    setTempPattern("");
    setTempIsWhitelist(true);
    setGraph(); // Trigger re-rendering of the graph
    setIsOpen(false);
  }, [clearFilter, setGraph]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilter();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [applyFilter],
  );

  const isPatternValid = validatePattern(tempPattern);
  const hasChanges = tempPattern !== pattern || tempIsWhitelist !== isWhitelist;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          "flex h-8 items-center gap-1 rounded px-2 py-1 transition-colors",
          "hover:bg-zinc-100 dark:hover:bg-zinc-700",
          isActive
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "text-zinc-600 dark:text-zinc-400",
        )}
        title="Filter JSON paths"
      >
        <div className="h-3.5 w-3.5">
          <FilterIcon />
        </div>
        {isActive && (
          <span className="hidden text-xs font-medium sm:inline">
            {isWhitelist ? "Include" : "Exclude"}
          </span>
        )}
        <div
          className={classNames(
            "h-3 w-3 transition-transform",
            isOpen ? "rotate-180" : "",
          )}
        >
          <ChevronDownIcon />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 z-50 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Filter Type
              </label>
              <select
                value={tempIsWhitelist ? "whitelist" : "blacklist"}
                onChange={handleFilterTypeChange}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                <option value="whitelist">
                  Whitelist (Include matching paths)
                </option>
                <option value="blacklist">
                  Blacklist (Exclude matching paths)
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Regular Expression Pattern
              </label>
              <input
                ref={inputRef}
                type="text"
                value={tempPattern}
                onChange={handlePatternChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g., ^user\\.(name|email)$"
                className={classNames(
                  "w-full rounded border px-3 py-1.5 text-sm focus:ring-1 focus:outline-none",
                  isPatternValid
                    ? "border-zinc-300 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600"
                    : "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600",
                  "dark:bg-zinc-700 dark:text-white",
                )}
              />
              {!isPatternValid && tempPattern && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <div className="h-3 w-3">
                    <ErrorIcon />
                  </div>
                  Invalid regular expression
                </div>
              )}
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <p className="mb-1">Examples:</p>
              <ul className="space-y-0.5 font-mono">
                <li>
                  • <code>^user</code> - Paths starting with &quot;user&quot;
                </li>
                <li>
                  • <code>(email|password)</code> - Paths containing
                  &quot;email&quot; or &quot;password&quot;
                </li>
                <li>
                  • <code>\\[\\d+\\]$</code> - Array indices at the end
                </li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilter}
                disabled={!isPatternValid}
                className={classNames(
                  "flex flex-1 items-center justify-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  isPatternValid && hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500",
                )}
              >
                <div className="h-3 w-3">
                  <CheckIcon />
                </div>
                Apply
              </button>

              {(isActive || tempPattern) && (
                <button
                  onClick={handleClearFilter}
                  className="flex items-center justify-center gap-1 rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <div className="h-3 w-3">
                    <CancelIcon />
                  </div>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
