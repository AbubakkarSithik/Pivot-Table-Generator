import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../lib/store";
import { Button } from "./ui/button";
import { toggleSidebar } from "../lib/store/slices/dataSlice";
import {  RiCloseLine} from "@remixicon/react";
import FilterBar from "./sideBars/FilterBar";
import ChangeFile from "./sideBars/ChangeFile";
import PivotTools from "./sideBars/PivotTools";

type SidebarProps = {
  file: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ file }: SidebarProps) => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.data.sidebarOpen);
  const { sideBarType } = useSelector((state: RootState) => state.data);

  if (!file) {
    return (
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out shadow-xl z-40 overflow-x-hidden overflow-y-auto hide-scroll`}
        style={{ width: sidebarOpen ? "420px" : 0 }}
      >
        <Button
          className="absolute top-4 right-4 w-10 h-10 rounded-r-md flex items-center justify-center bg-[#f7f5f2] text-black shadow-md"
          onClick={() => dispatch(toggleSidebar())}
          variant="outline"
        >
          <RiCloseLine size={22} />
        </Button>

        {sidebarOpen && (
          <div className="flex flex-col h-full">
            <div className="p-4 h-full flex flex-col justify-center items-center">
              <p className="text-xl text-gray-300 mt-1 flex flex-col items-center gap-2">
                <span className="text-4xl">🤔</span>
                Please upload a CSV file first
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out shadow-xl z-50 overflow-x-hidden overflow-y-auto hide-scroll`}
        style={{ width: sidebarOpen ? "420px" : 0 }}
      >
        <Button
          className="absolute top-4 right-4 w-10 h-10 rounded-r-md flex items-center justify-center bg-white text-black shadow-md z-[999]"
          onClick={() => dispatch(toggleSidebar())}
          variant="outline"
        >
          <RiCloseLine size={22} />
        </Button>
        { sidebarOpen && sideBarType === "pivotTools" && <PivotTools />}
        { sidebarOpen && sideBarType === "fileChanger" && <ChangeFile /> }
        { sidebarOpen && sideBarType === "filters" &&  <FilterBar />}
      </div>
    </>
  );
};

export default Sidebar;