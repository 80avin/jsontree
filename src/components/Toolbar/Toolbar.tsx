import Tools from "@/components/Toolbar/Tools";
import Shortcuts from "./Shortcuts";
import { Searchbar } from "../Searchbar";
import { FilterToolbar } from "../FilterToolbar";
import { SaveLoadToolbar } from "../SaveLoadToolbar";

export function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <Searchbar />
      <FilterToolbar />
      <SaveLoadToolbar />
      <Tools />
      <Shortcuts />
    </div>
  );
}
