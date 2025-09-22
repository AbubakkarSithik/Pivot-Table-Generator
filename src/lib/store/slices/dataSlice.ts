import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { sideBarType ,DataState , AggregatorType} from "@/lib/types/type";


const initialState: DataState = {
  fileName: null,
  data: [],
  columns: [],
  sidebarOpen: false,
  rows: [],
  cols: [],
  values: [],
  filters: [],
  filterValues: {},
  sideBarType: "pivotTools",
};

const inferType = (value: string): string => {
  if (!value) return "string";
  if (!isNaN(Number(value))) return "number";
  if (Date.parse(value)) return "date";
  return "string";
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<Record<string, string>[]>) => {
      state.data = action.payload;

      if (action.payload.length > 0) {
        const firstRow = action.payload[0];
        state.columns = Object.keys(firstRow).map((key) => {
          const sampleValue =
            action.payload.find((row) => row[key] && row[key].trim() !== "")?.[key] || "";
          return { name: key, type: inferType(sampleValue) };
        });
      }

      state.sidebarOpen = true;

      state.rows = [];
      state.cols = [];
      state.values = [];
      state.filters = [];
    },
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setRows: (state, action: PayloadAction<string[]>) => {
      state.rows = action.payload;
    },
    setCols: (state, action: PayloadAction<string[]>) => {
      state.cols = action.payload;
    },
    setValues(state, action: PayloadAction<{ field: string; aggregator: AggregatorType }[]>) {
      state.values = action.payload;
    },
    updateValueAggregator(
      state,
      action: PayloadAction<{ field: string; aggregator: AggregatorType }>
    ) {
      const { field, aggregator } = action.payload;
      const v = state.values.find((val) => val.field === field);
      if (v) v.aggregator = aggregator;
    },
    
    setSideBarType: (state, action: PayloadAction<sideBarType>) => {
      state.sideBarType = action.payload;
    },
    setFilters: (state, action: PayloadAction<string[]>) => {
        state.filters = action.payload;
        Object.keys(state.filterValues).forEach((f) => {
          if (!action.payload.includes(f)) {
            delete state.filterValues[f];
          }
        });
        action.payload.forEach((f) => {
          if (!(f in state.filterValues)) {
            state.filterValues[f] = null;
          }
        });
    },
    setFilterValue: (
      state,
      action: PayloadAction<{ field: string; value: string | null }>
    ) => {
      const { field, value } = action.payload;
      state.filterValues[field] = value;
    },
  },
});

export const { setData, setFileName, toggleSidebar, setSideBarType, setCols, setRows, setValues, setFilters, setFilterValue, updateValueAggregator } = dataSlice.actions;
export default dataSlice.reducer;