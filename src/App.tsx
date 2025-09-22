import { useState } from "react";
import DataTable from "./components/DataTable";
import FileUploader from "./components/FileUploader";
import Sidebar from "./components/SideBar";
import "./App.css";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./lib/store";
import { Button } from "./components/ui/button";
import { RiFile2Line, RiFilterFill, RiTableLine } from "@remixicon/react";
import { toggleSidebar ,setSideBarType } from "./lib/store/slices/dataSlice";

function App() {
   const [loading, setLoading] = useState(false);
   const dispatch = useDispatch();
   const{ sidebarOpen,fileName } = useSelector((state: RootState) => state.data);
   const filtersCols = useSelector((state: RootState) => state.data.filters);

  return (
    <div className="flex">
      {!sidebarOpen && 
      <div className="fixed top-4 left-[10px] w-fit flex flex-col gap-2 justify-center items-start z-50 ">
        <Button
          className="h-10 rounded-r-md flex items-center justify-center bg-[#f7f5f2] text-black shadow-md group transition-all duration-300"
          onClick={() => {dispatch(toggleSidebar()); dispatch(setSideBarType("pivotTools"))}}
          variant="outline"
        >
            <RiTableLine size={22} />
            <span className="hidden group-hover:inline text-sm">Pivot</span>
        </Button>
        { fileName && <Button
          className=" h-10 rounded-r-md flex items-center justify-center bg-[#f7f5f2] text-black shadow-md group transition-all duration-300"
          onClick={() =>{ dispatch(toggleSidebar()) ; dispatch(setSideBarType("fileChanger"))}}
          variant="outline"
        >
            <RiFile2Line size={22} />
            <span className="hidden group-hover:inline text-sm">Change File</span>
        </Button>}
        {filtersCols.length > 0 && (
                  <Button
                    className="relative  h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-black shadow-lg group transition-all duration-300 "
                    onClick={() => {dispatch(toggleSidebar()) ; dispatch(setSideBarType("filters"))}}
                  >
                        <RiFilterFill size={24} />
                        <span className="hidden group-hover:inline text-sm">Filters</span>
                        <div className="absolute -top-1 -right-1 w-4 h-4 text-white text-xs bg-red-500 rounded-full z-90">{filtersCols.length}</div>
                  </Button>
          )}
      </div>
      }
      <Sidebar file={loading}/>
      <nav className={`fixed top-0 left-0 w-full transition-all duration-300 ease-in-out bg-white/10 backdrop-blur-lg p-2 ${sidebarOpen ? "ml-[205px]" : "ml-0"}`}> 
        <h1 className="font-bold text-center">Pivot Table Generator</h1>
      </nav>
      <main
        className={`transition-all duration-300 ease-in-out flex-1 flex justify-center overflow-x-hidden items-start p-6`}
        style={{
          marginLeft: sidebarOpen ? "420px" : "20px", 
        }}
      >
        <div className="w-full ">
          <div className="max-w-[600px] w-full mx-auto">
            <FileUploader setLoading={setLoading} />
          </div>
          <div className="p-2 mt-8 bg-red-200 rounded-xl shadow-xl">
             <DataTable />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
