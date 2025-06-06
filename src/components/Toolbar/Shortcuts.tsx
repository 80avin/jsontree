import { Fragment, useMemo, useState } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { getNextDirection } from "@/core/graph/getNextDirection";
import { useHotkeys } from "@/hooks/useHotKeys";
import { useTree } from "@/store/useTree";
import {
  ChevronDownIcon,
  FocusIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  ArrowPath,
  DownloadIcon,
  JsonIcon,
  ShareIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/Icons";
import { useStored } from "@/store/useStored";
import { DownloadImageModal } from "@/components/modals/DownloadImageModal";

export default function Shortcuts() {
  const fullscreen = useTree((state) => state.fullscreen);
  const toggleFullscreen = useTree((state) => state.toggleFullscreen);
  const theme = useStored((state) => state.lightmode);
  const setTheme = useStored((state) => state.setLightTheme);
  const centerView = useTree((state) => state.centerView);
  const zoomIn = useTree((state) => state.zoomIn);
  const zoomOut = useTree((state) => state.zoomOut);
  const share = useTree((state) => state.share);
  const direction = useTree((state) => state.direction);
  const setDirection = useTree((state) => state.setDirection);

  const [isDownloadModalOpen, setIsDownloadModal] = useState(false);

  const modKey = useMemo(() => {
    if (typeof window !== "undefined") {
      if (/Mac|iPod|iPhone|iPad/.test(navigator.platform)) {
        return "⌘";
      } else {
        return "CTRL";
      }
    }
    return "";
  }, []);

  const toggleEditor = () => toggleFullscreen(!fullscreen);

  const toggleDirection = () => {
    const nextDirection = getNextDirection(direction);
    setDirection(nextDirection);
  };

  useHotkeys([
    ["mod,shift,E", toggleEditor],
    ["mod,shift,D", toggleDirection],
  ]);

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton
          className="dark:bg-vsdark-500 inline-flex h-8 w-8 items-center justify-center gap-1 rounded-md border border-gray-300 p-0 text-sm text-gray-700 hover:bg-gray-200 md:w-auto md:px-2 md:py-1 dark:border-gray-500 dark:text-gray-300 dark:hover:border-yellow-400 dark:hover:text-yellow-400"
          aria-label="Shortcut menu"
        >
          <span className="hidden md:inline">Shortcuts</span>
          <div className="-mr-1 ml-2 hidden h-4 w-4 md:inline-block">
            <ChevronDownIcon />
          </div>
          <span className="h-5 w-5 md:hidden">
            <MenuIcon />
          </span>
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="dark:bg-vsdark-500 absolute right-0 z-50 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white p-1 shadow-xl ring-1 ring-black/5 focus:outline-hidden md:w-56 dark:divide-y-0 dark:ring-1 dark:shadow-yellow-700/10 dark:ring-gray-600">
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:justify-between`}
                  onClick={toggleEditor}
                >
                  <div className="h-4 w-4 md:hidden">
                    <JsonIcon />
                  </div>
                  Toggle Editor
                  <kbd
                    className={`ml-2 hidden rounded-md border border-gray-200 p-1 text-xs md:inline ${
                      focus
                        ? "border-gray-100 bg-yellow-300 text-gray-900"
                        : "bg-gray-200 dark:text-gray-900"
                    }`}
                  >
                    {modKey} SHIFT E
                  </kbd>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:hidden`}
                  onClick={share}
                >
                  <div className="h-4 w-4">
                    <ShareIcon />
                  </div>
                  Share URL
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:justify-between`}
                  onClick={toggleDirection}
                >
                  <div className="h-4 w-4 md:hidden">
                    <ArrowPath />
                  </div>
                  Rotate grid
                  <kbd
                    className={`ml-2 hidden rounded-md border border-gray-200 p-1 text-xs md:inline ${
                      focus
                        ? "border-gray-100 bg-yellow-300 text-gray-900"
                        : "bg-gray-200 dark:text-gray-900"
                    }`}
                  >
                    {modKey} SHIFT D
                  </kbd>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:justify-between`}
                  onClick={centerView}
                >
                  <div className="h-4 w-4 md:hidden">
                    <FocusIcon />
                  </div>
                  Center View
                  <kbd
                    className={`ml-2 hidden rounded-md border border-gray-200 p-1 text-xs md:inline ${
                      focus
                        ? "border-gray-100 bg-yellow-300 text-gray-900"
                        : "bg-gray-200 dark:text-gray-900"
                    }`}
                  >
                    {modKey} SHIFT C
                  </kbd>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:hidden`}
                  onClick={zoomIn}
                >
                  <div className="h-4 w-4">
                    <ZoomInIcon />
                  </div>
                  Zoom In
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm md:hidden`}
                  onClick={zoomOut}
                >
                  <div className="h-4 w-4">
                    <ZoomOutIcon />
                  </div>
                  Zoom Out
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group hidden w-full items-center justify-between rounded-md px-2 py-2 text-sm md:flex`}
                  onClick={zoomIn}
                >
                  Zoom In
                  <kbd
                    className={`ml-2 hidden rounded-md border border-gray-200 p-1 text-xs md:inline ${
                      focus
                        ? "border-gray-100 bg-yellow-300 text-gray-900"
                        : "bg-gray-200 dark:text-gray-900"
                    }`}
                  >
                    {modKey} SHIFT +
                  </kbd>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } group hidden w-full items-center justify-between rounded-md px-2 py-2 text-sm md:flex`}
                  onClick={zoomOut}
                >
                  Zoom Out
                  <kbd
                    className={`ml-2 hidden rounded-md border border-gray-200 p-1 text-xs md:inline ${
                      focus
                        ? "border-gray-100 bg-yellow-300 text-gray-900"
                        : "bg-gray-200 dark:text-gray-900"
                    }`}
                  >
                    {modKey} SHIFT -
                  </kbd>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm md:hidden`}
                  onClick={() => setTheme(!theme)}
                >
                  {theme ? (
                    <div className="h-4 w-4">
                      <MoonIcon />
                    </div>
                  ) : (
                    <div className="h-4 w-4">
                      <SunIcon />
                    </div>
                  )}
                  {theme ? "Dark mode" : "Light mode"}
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={`${
                    focus
                      ? "bg-gray-900 text-white dark:text-yellow-400"
                      : "text-gray-900 dark:text-white"
                  } flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm md:hidden`}
                  onClick={() => setIsDownloadModal(true)}
                >
                  <div className="h-4 w-4">
                    <DownloadIcon />
                  </div>
                  Download diagram
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
      <DownloadImageModal
        isOpen={isDownloadModalOpen}
        setOpen={setIsDownloadModal}
      />
    </>
  );
}
