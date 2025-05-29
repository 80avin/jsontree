import React, { useState, useRef, useEffect } from "react";
import { useSavedJsons, SavedJsonState } from "@/store/useSavedJsons";
import { classNames } from "@/utility/classNames";
import { ChevronDownIcon, CheckIcon, CancelIcon } from "@/components/Icons";

export function SaveLoadToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { savedJsons, saveJson, loadJson, deleteJson, updateJsonName } =
    useSavedJsons();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSaveMode(false);
        setSaveName("");
        setMessage({ text: "", type: "" });
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when save mode is activated
  useEffect(() => {
    if (saveMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [saveMode]);

  const handleSave = async () => {
    if (!saveName.trim()) {
      setMessage({ text: "Please enter a name", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await saveJson(saveName.trim());
      setMessage({ text: "JSON saved successfully!", type: "success" });
      setSaveName("");
      setSaveMode(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 2000);
    } catch (error) {
      setMessage({ text: "Failed to save JSON", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    setIsLoading(true);
    try {
      await loadJson(id);
      setMessage({ text: "JSON loaded successfully!", type: "success" });
      setIsOpen(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 2000);
    } catch (error) {
      setMessage({ text: "Failed to load JSON", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteJson(id);
      setMessage({ text: "JSON deleted", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setSaveMode(false);
      setSaveName("");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 items-center gap-1 rounded px-2 py-1 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
        title="Save/Load JSON with settings"
      >
        <div className="h-3.5 w-3.5">
          <SaveIcon />
        </div>
        <span className="hidden text-xs font-medium sm:inline">Save/Load</span>
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
        <div className="absolute top-10 right-0 z-50 flex max-h-96 w-80 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Save & Load JSON
            </h3>
            {!saveMode && (
              <button
                onClick={() => setSaveMode(true)}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-700"
              >
                Save Current
              </button>
            )}
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={classNames(
                "mb-3 rounded p-2 text-xs",
                message.type === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
              )}
            >
              {message.text}
            </div>
          )}

          {/* Save Mode */}
          {saveMode && (
            <div className="mb-4 space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a name for this JSON..."
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isLoading || !saveName.trim()}
                  className={classNames(
                    "flex flex-1 items-center justify-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    saveName.trim() && !isLoading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500",
                  )}
                >
                  <div className="h-3 w-3">
                    <CheckIcon />
                  </div>
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setSaveMode(false);
                    setSaveName("");
                  }}
                  className="flex items-center justify-center gap-1 rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <div className="h-3 w-3">
                    <CancelIcon />
                  </div>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Saved JSONs List */}
          <div className="flex-1 overflow-y-auto">
            {savedJsons.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No saved JSONs yet.
                <br />
                Save your current JSON to get started!
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Saved JSONs ({savedJsons.length})
                </h4>
                {savedJsons
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((savedJson) => (
                    <SavedJsonItem
                      key={savedJson.id}
                      savedJson={savedJson}
                      onLoad={handleLoad}
                      onDelete={handleDelete}
                      onUpdateName={updateJsonName}
                      isLoading={isLoading}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Saves JSON content with current filter and rotation settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface SavedJsonItemProps {
  savedJson: SavedJsonState;
  onLoad: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onUpdateName: (id: string, newName: string) => void;
  isLoading: boolean;
}

function SavedJsonItem({
  savedJson,
  onLoad,
  onDelete,
  onUpdateName,
  isLoading,
}: SavedJsonItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(savedJson.name);

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== savedJson.name) {
      onUpdateName(savedJson.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditName(savedJson.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="group rounded border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700/50">
      {/* Name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveName}
          className="mb-1 w-full border-b border-blue-500 bg-transparent text-sm font-medium text-zinc-800 outline-none dark:text-zinc-200"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="mb-1 w-full text-left text-sm font-medium text-zinc-800 transition-colors hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400"
        >
          {savedJson.name}
        </button>
      )}

      {/* Settings Info */}
      <div className="mb-2 flex flex-wrap gap-1">
        {savedJson.filter.isActive && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {savedJson.filter.isWhitelist ? "Include" : "Exclude"}:{" "}
            {savedJson.filter.pattern}
          </span>
        )}
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
          {savedJson.tree.direction}
        </span>
        {savedJson.tree.foldNodes && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
            Folded
          </span>
        )}
      </div>

      {/* Date */}
      <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        {new Date(savedJson.updatedAt).toLocaleString()}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onLoad(savedJson.id)}
          disabled={isLoading}
          className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Load
        </button>
        <button
          onClick={() => onDelete(savedJson.id, savedJson.name)}
          disabled={isLoading}
          className="rounded px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Save Icon Component
function SaveIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height="100%"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17,21 17,13 7,13 7,21"></polyline>
      <polyline points="7,3 7,8 15,8"></polyline>
    </svg>
  );
}
