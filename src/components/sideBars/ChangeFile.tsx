import React, { useRef} from "react";
import Papa from "papaparse";
import { Button } from "../ui/button";
import { useDispatch , useSelector } from "react-redux";
import { setData , setFileName ,setSideBarType } from "../../lib/store/slices/dataSlice";
import type { RootState } from "@/lib/store";

const ChangeFile: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dispatch = useDispatch();
  const { fileName } = useSelector((state: RootState) => state.data);
  
  const handleFileUpload = (file: File) => {
    dispatch(setFileName(file.name));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        dispatch(setData(results.data as Record<string, string>[]));
      },
    });

    dispatch(setSideBarType("pivotTools"));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
    <div className={`h-full text-white transition-all duration-300 ease-in-out`}>
    <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
        <div className="flex flex-col justify-center gap-5 items-center h-full">
            <h2 className="text-xl">Replace Existing File</h2>
        <div className="flex flex-col gap-8 items-center justify-center max-w-3/4 max-h-1/2 h-full min-w-2/3 rounded-xl bg-gray-500 backdrop-blur-md p-4">
          <div className="flex items-center gap-3">
            <span className="text-black font-medium  truncate max-w-xs text-lg">
              {fileName}
            </span>
            <span className="text-sm text-green-400 font-semibold">✔</span>
          </div>
          <Button
            variant="ghost"
            className="bg-white border border-gray-800 hover:border-gray-400 text-black cursor-pointer"
            size="sm"
            onClick={triggerFilePicker}
          >
            Change File
          </Button>
        </div>
        </div>
     
    </div>
    </>
  );
};

export default ChangeFile;