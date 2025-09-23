import type { DataState, AggregatorType, PivotResult } from "@/lib/types/type";

function cartesianProduct(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<string[][]>(
    (acc, curr) =>
      acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]]
  );
}

function getUniqueValues(data: any[], field: string): string[] {
  const set = new Set<string>();
  data.forEach((row) => {
    set.add(String(row[field] ?? ""));
  });
  const values = Array.from(set);
  values.sort();
  return values;
}

function buildKey(parts: string[]): string {
  return parts.join("||");
}

export function computeRowSpans(rowCombinations: string[][], rowFields: string[]): number[][] {
  const R = rowCombinations.length;
  const L = rowFields.length;
  const spans: number[][] = Array.from({ length: R }, () => new Array(L).fill(1));

  if (R === 0 || L === 0) return spans;

  const lastValue: string[] = new Array(L).fill("");
  const lastIndex: number[] = new Array(L).fill(0);

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < L; c++) {
      const val = rowCombinations[r][c] ?? "";
      if (r === 0 || val !== lastValue[c] || (c > 0 && rowCombinations[r].slice(0, c).join("||") !== rowCombinations[r - 1].slice(0, c).join("||"))) {
        lastValue[c] = val;
        lastIndex[c] = r;
        spans[r][c] = 1;
      } else {
        spans[lastIndex[c]][c]++;
        spans[r][c] = 0;
      }
    }
  }

  return spans;
}

export function generatePivot(state: DataState): PivotResult {
  const { data, rows, cols, values, filters, filterValues } = state;

  const rowFields = rows ?? [];
  const colFields = cols ?? [];
  const valueDefs = values ?? [];
  const hasExplicitValues = valueDefs.length > 0;

  let filteredData = data;
  filters.forEach((f) => {
    const selected = filterValues[f];
    if (selected && selected !== "all") {
      filteredData = filteredData.filter((row) => String(row[f] ?? "") === selected);
    }
  });
  const rowCombinations: string[][] = [];
  const rowKeyMap = new Map<string, number>();
  if (rowFields.length > 0) {
    filteredData.forEach((row) => {
      const parts = rowFields.map((f) => String(row[f] ?? ""));
      const key = buildKey(parts);
      if (!rowKeyMap.has(key)) {
        rowKeyMap.set(key, rowCombinations.length);
        rowCombinations.push(parts);
      }
    });
  } else {
    rowCombinations.push([]);
    rowKeyMap.set("", 0);
  }

  const colCombinations: string[][] = [];
  const colKeyMap = new Map<string, number>();
  if (colFields.length > 0) {
    const colValues: string[][] = colFields.map((f) => getUniqueValues(filteredData, f));
    const combos = cartesianProduct(colValues);
    combos.forEach((parts, idx) => {
      const key = buildKey(parts);
      colKeyMap.set(key, idx);
      colCombinations.push(parts);
    });
  } else {
    colCombinations.push([]);
    colKeyMap.set("", 0);
  }

  const effectiveValueDefs = hasExplicitValues
    ? valueDefs
    : [{ field: "Count", aggregator: "count" as AggregatorType }];

  const R = rowCombinations.length;
  const C = colCombinations.length;
  const V = effectiveValueDefs.length;

  const matrix: (number | null)[][][] = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => Array.from({ length: V }, () => null))
  );

  const dataMap = new Map<string, any[]>();
  filteredData.forEach((row) => {
    const rowKey = rowFields.length > 0 ? buildKey(rowFields.map((f) => String(row[f] ?? ""))) : "";
    const colKey = colFields.length > 0 ? buildKey(colFields.map((f) => String(row[f] ?? ""))) : "";
    const key = rowKey + "||" + colKey;
    if (!dataMap.has(key)) dataMap.set(key, []);
    dataMap.get(key)!.push(row);
  });

  rowCombinations.forEach((rParts, ri) => {
    colCombinations.forEach((cParts, ci) => {
      const rowKey = buildKey(rParts);
      const colKey = buildKey(cParts);
      const key = rowKey + "||" + colKey;
      const subset = dataMap.get(key);
      if (!subset || subset.length === 0) return;

      effectiveValueDefs.forEach(({ field: valField, aggregator }, vi) => {
        const rawVals = subset.map((r) => r[valField]);
        if (aggregator === "count") {
          matrix[ri][ci][vi] = subset.length;
          return;
        }
        const numbers = rawVals.map((v) => Number(v)).filter((n) => !isNaN(n));
        if (numbers.length === 0) return;
        switch (aggregator) {
          case "sum":
            matrix[ri][ci][vi] = numbers.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            matrix[ri][ci][vi] = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            break;
          case "min":
            matrix[ri][ci][vi] = Math.min(...numbers);
            break;
          case "max":
            matrix[ri][ci][vi] = Math.max(...numbers);
            break;
        }
      });
    });
  });

  return {
    rowFields,
    colFields,
    valueFields: hasExplicitValues
      ? valueDefs.map((v) => `${v.field} (${v.aggregator.toUpperCase()})`)
      : ["Count"],
    rowCombinations,
    colCombinations,
    matrix,
    wasImplicit: !hasExplicitValues,
  };
}