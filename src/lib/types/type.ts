export interface FileUploaderProps {
  onDataParsed: (data: Record<string, string>[]) => void;
  setLoading: (loading: boolean) => void;
}

export interface DataTableProps {
  data: Record<string, string>[];
}

export type Column = {
  name: string;
  type: string;
};

export type AggregatorType = "sum" | "count" | "avg" | "min" | "max";

export type ColumnItem = {
  name: string;
  type: string;
};

export interface DataState {
  fileName: string | null;
  data: Record<string, string>[];
  columns: Column[];
  sidebarOpen: boolean;
  rows: string[];
  cols: string[];
  values: { field: string; aggregator: AggregatorType }[];
  filters: string[];
  filterValues: Record<string, string | null>;
  sideBarType: sideBarType;
}

export interface PivotResult {
  rowFields: string[];
  colFields: string[];
  valueFields: string[];
  rowCombinations: string[][];
  colCombinations: string[][];
  matrix: (number | null)[][][];
  wasImplicit: boolean;
}

export interface PivotOptions {
  sortRowIndex?: number | null; 
  sortRowDir?: "asc" | "desc" | null;
  sortColIndex?: number | null; 
  sortColDir?: "asc" | "desc" | null;
}

export type sideBarType = "pivotTools" | "fileChanger" | "filters";