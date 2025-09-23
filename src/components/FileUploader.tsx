import React, { useEffect } from "react";
import Papa from "papaparse";
import { Input } from "./ui/input";
import { useDispatch , useSelector } from "react-redux";
import type { RootState } from "../lib/store";
import { setData , setFileName ,setSideBarType } from "../lib/store/slices/dataSlice";

const FileUploader: React.FC<{ setLoading: (val: boolean) => void }> = ({
  setLoading,
}) => {
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

  useEffect(() => {
    if (fileName) {
      setLoading(true);
    }else{
      setLoading(false);
    }
  }, [fileName]);

  if (fileName) {
    return null;
  }

  return (
    <div className={`my-5`}>
      {!fileName && <h2 className="text-lg font-semibold mb-2">Upload CSV File</h2>}
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer bg-red-200 hover:border hover:border-gray-800 transition-all duration-300"
          />
    </div>
  );
};

export default FileUploader;
