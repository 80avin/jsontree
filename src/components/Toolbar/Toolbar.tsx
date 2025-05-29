import Tools from "@/components/Toolbar/Tools";
import Shortcuts from "./Shortcuts";
import { Searchbar } from "../Searchbar";
import { FilterToolbar } from "../FilterToolbar";

export function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <Searchbar />
      <FilterToolbar />
      <Tools />
      <Shortcuts />
    </div>
  );
}
