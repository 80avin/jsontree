import {
  Dialog,
  DialogPanel,
  Switch,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  type SyntheticEvent,
  useState,
} from "react";
import { toPng, toSvg, toBlob } from "html-to-image";
import { classNames } from "@/utility/classNames";
import { useStored } from "@/store/useStored";
import { CancelIcon } from "@/components/Icons";

function downloadURI(uri: string, name: string) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type DownloadDesignModal = {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const EXPORT_IMAGE_FN = {
  png: toPng,
  svg: toSvg,
  blob: toBlob,
} as const;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function DownloadImageModal(props: DownloadDesignModal) {
  const { isOpen, setOpen } = props;
  const lightmode = useStored((state) => state.lightmode);
  const [imageName, setImageName] = useState<string>("jsontree");
  const [isPNG, setIsPNG] = useState<boolean>(true);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);

  const handleClose = () => {
    setImageName("jsontree");
    setOpen(false);
  };

  const copyToClipboard = async (
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    let orig: string = "Copy";
    const elem = e.currentTarget;
    const blob = await getImageURI("blob", isTransparent, lightmode);
    if (!blob) {
      elem.innerText = "Copy Failed";
      elem.dataset.failed = "";
      await delay(0);
      setTimeout(() => {
        delete elem.dataset.failed;
        elem.innerText = orig;
      }, 5000);
      return;
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    if (elem) {
      elem.innerText = "Copied";
      elem.dataset.copied = "";
      await delay(0);
      setTimeout(() => {
        delete elem.dataset.copied;
        elem.innerText = orig;
      }, 2000);
    }
  };

  const exportAsImage = async () => {
    try {
      const ext = isPNG ? "png" : "svg";
      const dataURI = await getImageURI(ext, isTransparent, lightmode);

      downloadURI(dataURI, `${imageName}.${ext}`);
    } catch (error) {
      // TODO: Show error toast
    } finally {
      // TODO: Show success toast
      handleClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/60"></div>
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md rounded-lg bg-white p-4 ring-1 ring-gray-500/20 dark:bg-zinc-800 dark:text-gray-300 dark:ring-gray-100/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold dark:text-gray-200">
                    Download Image
                  </span>
                  <button
                    className="h-5 w-5 rounded-full text-gray-500 hover:text-gray-600 dark:text-gray-200 dark:hover:text-yellow-400"
                    onClick={handleClose}
                  >
                    <CancelIcon />
                  </button>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div className="w-2/3">
                    <label
                      htmlFor="first-name"
                      className="block text-sm leading-6"
                    >
                      File name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        aria-label="image name"
                        placeholder="jsontree"
                        value={imageName}
                        onChange={(e) => setImageName(e.target.value)}
                        className="dark:bg-vsdark-500 block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:ring-inset sm:text-sm sm:leading-6 dark:text-gray-200 dark:ring-0 dark:focus:ring-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Switch
                      checked={isPNG}
                      onChange={setIsPNG}
                      className={classNames(
                        "bg-vsdark-500 dark:bg-vsdark-500 relative flex h-10 items-center gap-4 rounded-lg px-1 py-2 text-xs font-semibold dark:ring-1 dark:ring-gray-300/20",
                      )}
                    >
                      <span className="sr-only">Choose image format</span>
                      <span className="pl-2 text-white">PNG</span>
                      <span className="pr-2 text-white">SVG</span>
                      <span
                        aria-hidden="true"
                        className={classNames(
                          isPNG ? "translate-x-0" : "translate-x-10",
                          "pointer-events-none absolute inline-block h-8 w-10 transform rounded-md bg-white p-2 transition duration-200 ease-in-out dark:bg-yellow-400 dark:text-zinc-900",
                        )}
                      >
                        {isPNG ? "PNG" : "SVG"}
                      </span>
                    </Switch>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-end gap-4">
                    <span className="dark:text-gray-200">
                      Transparent background
                    </span>
                    <Switch
                      checked={isTransparent}
                      onChange={setIsTransparent}
                      className={classNames(
                        isTransparent ? "bg-yellow-500" : "bg-vsdark-500",
                        "relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-[2px] transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/75 dark:ring-1 dark:ring-gray-300/20",
                      )}
                    >
                      <span className="sr-only">Set Image transparency</span>
                      <span
                        aria-hidden="true"
                        className={classNames(
                          isTransparent ? "translate-x-6" : "translate-x-0",
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        )}
                      />
                    </Switch>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    aria-label="download image"
                    onClick={copyToClipboard}
                    className="data-copied:green-100 mt-8 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-400 data-copied:bg-green-500 data-copied:text-white data-failed:bg-red-600 data-failed:text-white"
                  >
                    Copy
                  </button>
                  <button
                    aria-label="download image"
                    onClick={exportAsImage}
                    className="mt-8 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-400"
                  >
                    Download
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

async function getImageURI<T extends keyof typeof EXPORT_IMAGE_FN>(
  outputType: T,
  isTransparent: boolean,
  lightmode: boolean,
) {
  const imageElement = document.querySelector("svg[id*='ref']") as HTMLElement;

  let exportImage = EXPORT_IMAGE_FN[outputType];

  const dataURI = (await exportImage(imageElement, {
    quality: 1,
    backgroundColor: isTransparent
      ? "transparent"
      : lightmode
        ? "#FFFFFF"
        : "#1E1E1E",
  })) as ReturnType<typeof exportImage>;
  return dataURI;
}
