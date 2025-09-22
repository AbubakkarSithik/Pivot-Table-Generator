import type { DataState, AggregatorType , PivotOptions , PivotResult} from "@/lib/types/type";

function getUniqueCombinations(data: any[], fields: string[]): string[][] {
  if (fields.length === 0) return [[]];
  const combos: string[][] = [];
  const seen = new Set<string>();

  data.forEach((row) => {
    const combo = fields.map((f) => String(row[f]));
    const key = combo.join("||");
    if (!seen.has(key)) {
      seen.add(key);
      combos.push(combo);
    }
  });

  return combos;
}

function sortCombinations(
  combos: string[][],
  sortIndex: number | null,
  direction: "asc" | "desc" | null
): string[][] {
  if (sortIndex === null || !direction) return combos;

  return [...combos].sort((a, b) => {
    const keyA = a[sortIndex] ?? "";
    const keyB = b[sortIndex] ?? "";
    if (direction === "asc") return keyA.localeCompare(keyB);
    return keyB.localeCompare(keyA);
  });
}

export function generatePivot(
  state: DataState,
  options: PivotOptions = {}
): PivotResult {
  const { data, rows, cols, values, filters, filterValues } = state;
  const {
    sortRowIndex = null,
    sortRowDir = null,
    sortColIndex = null,
    sortColDir = null,
  } = options;

  const rowFields = rows ?? [];
  const colFields = cols ?? [];
  const valueDefs = values ?? [];

  if (valueDefs.length === 0) {
    return {
      rowFields,
      colFields,
      valueFields: [],
      rowCombinations: [],
      colCombinations: [],
      matrix: [],
    };
  }

  // Apply filters
  let filteredData = data;
  filters.forEach((f) => {
    const selected = filterValues[f];
    if (selected) {
      filteredData = filteredData.filter((row) => row[f] === selected);
    }
  });

  let rowCombinations = getUniqueCombinations(filteredData, rowFields);
  let colCombinations = getUniqueCombinations(filteredData, colFields);

  rowCombinations = sortCombinations(rowCombinations, sortRowIndex, sortRowDir);
  colCombinations = sortCombinations(colCombinations, sortColIndex, sortColDir);

  const R = rowCombinations.length;
  const C = colCombinations.length;
  const V = valueDefs.length;

  const matrix: (number | null)[][][] = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => Array.from({ length: V }, () => null))
  );

  const matchCombo = (row: any, fields: string[], parts: string[]) =>
    fields.every((f, i) => String(row[f]) === parts[i]);

  for (let ri = 0; ri < R; ri++) {
    for (let ci = 0; ci < C; ci++) {
      const rowParts = rowCombinations[ri];
      const colParts = colCombinations[ci];

      const subset = filteredData.filter(
        (r) =>
          matchCombo(r, rowFields, rowParts) &&
          matchCombo(r, colFields, colParts)
      );

      for (let vi = 0; vi < V; vi++) {
        const { field: valField, aggregator } = valueDefs[vi];
        const rawVals = subset.map((r) => r[valField]);
        const valuesArr = rawVals
          .map((v) => Number(v))
          .filter((n) => !isNaN(n));

        if (subset.length === 0) {
          matrix[ri][ci][vi] = null;
          continue;
        }

       if (valuesArr.length === 0) {
            if (aggregator === "count") {
                matrix[ri][ci][vi] = subset.length;
            } else {
                matrix[ri][ci][vi] = null; 
            }
            continue;
        }

        switch (aggregator as AggregatorType) {
          case "sum":
            matrix[ri][ci][vi] =
              valuesArr.length > 0
                ? valuesArr.reduce((a, b) => a + b, 0)
                : null;
            break;
          case "count":
            matrix[ri][ci][vi] = subset.length;
            break;
          case "avg":
            matrix[ri][ci][vi] =
              valuesArr.reduce((a, b) => a + b, 0) / valuesArr.length;
            break;
          case "min":
            matrix[ri][ci][vi] = Math.min(...valuesArr);
            break;
          case "max":
            matrix[ri][ci][vi] = Math.max(...valuesArr);
            break;
          default:
            matrix[ri][ci][vi] = null;
        }
      }
    }
  }

  return {
    rowFields,
    colFields,
    valueFields: valueDefs.map(
      (v) => `${v.field} (${v.aggregator.toUpperCase()})`
    ),
    rowCombinations,
    colCombinations,
    matrix,
  };
}