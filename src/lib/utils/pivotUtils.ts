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
    // Use an empty string for null or undefined values to ensure they are grouped
    set.add(String(row[field] ?? ""));
  });
  const values = Array.from(set);
  values.sort(); // Sort for consistent order
  return values;
}

// Helper to check if a row matches a specific combination of field values
const matchCombo = (row: any, fields: string[], parts: string[]) =>
  fields.every((f, i) => String(row[f] ?? "") === parts[i]);


export function generatePivot(state: DataState): PivotResult {
  const { data, rows, cols, values, filters, filterValues } = state;

  const rowFields = rows ?? [];
  const colFields = cols ?? [];
  const valueDefs = values ?? [];
  const hasExplicitValues = valueDefs.length > 0;

  // 1. Apply filters to the data
  let filteredData = data;
  filters.forEach((f) => {
    const selected = filterValues[f];
    if (selected && selected !== "all") {
      filteredData = filteredData.filter((row) => String(row[f] ?? "") === selected);
    }
  });

  // 2. Build unique row combinations
  let rowCombinations: string[][] = [[]]; // Default for case with no row fields
  if (rowFields.length > 0) {
    const rowSet = new Set<string>();
    const foundCombinations: string[][] = [];
    filteredData.forEach(row => {
      const combo = rowFields.map(f => String(row[f] ?? ''));
      const key = combo.join('||');
      if (!rowSet.has(key)) {
        rowSet.add(key);
        foundCombinations.push(combo);
      }
    });
    // Use the found combinations if any exist
    if (foundCombinations.length > 0) rowCombinations = foundCombinations;
  }

  // 3. Build unique column combinations
  let colCombinations: string[][] = [[]]; // Default for case with no col fields
  if (colFields.length > 0) {
    const colValues: string[][] = colFields.map(f => getUniqueValues(filteredData, f));
    const foundCombinations = cartesianProduct(colValues);
    if (foundCombinations.length > 0 && foundCombinations[0].length > 0) {
       colCombinations = foundCombinations;
    }
  }

  // 4. If no value fields are provided, use "Count" as the default aggregator
  const effectiveValueDefs = hasExplicitValues
    ? valueDefs
    : [{ field: "Count", aggregator: "count" as AggregatorType }];

  const R = rowCombinations.length;
  const C = colCombinations.length;
  const V = effectiveValueDefs.length;

  // 5. Initialize the matrix with nulls
  const matrix: (number | null)[][][] = Array.from({ length: R }, () =>
    Array.from({ length: C }, () => Array.from({ length: V }, () => null))
  );

  // 6. Populate the matrix with aggregated values
  for (let ri = 0; ri < R; ri++) {
    for (let ci = 0; ci < C; ci++) {
      const rowParts = rowCombinations[ri];
      const colParts = colCombinations[ci];

      const subset = filteredData.filter(r =>
        matchCombo(r, rowFields, rowParts) && matchCombo(r, colFields, colParts)
      );

      if (subset.length === 0) continue; // Skip if no data for this intersection

      for (let vi = 0; vi < V; vi++) {
        const { field: valField, aggregator } = effectiveValueDefs[vi];
        const rawVals = subset.map((r) => r[valField]);

        if (aggregator === "count") {
          matrix[ri][ci][vi] = subset.length;
          continue;
        }

        const valuesArr = rawVals.map((v) => Number(v)).filter((n) => !isNaN(n));
        if (valuesArr.length === 0) continue;

        switch (aggregator) {
          case "sum":
            matrix[ri][ci][vi] = valuesArr.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            matrix[ri][ci][vi] = valuesArr.reduce((a, b) => a + b, 0) / valuesArr.length;
            break;
          case "min":
            matrix[ri][ci][vi] = Math.min(...valuesArr);
            break;
          case "max":
            matrix[ri][ci][vi] = Math.max(...valuesArr);
            break;
        }
      }
    }
  }

  // 7. Return the complete pivot result
  return {
    rowFields,
    colFields,
    valueFields: hasExplicitValues
      ? valueDefs.map(v => `${v.field} (${v.aggregator.toUpperCase()})`)
      : ['Count'],
    rowCombinations,
    colCombinations,
    matrix,
    wasImplicit: !hasExplicitValues, // Let the UI know if 'Count' was added automatically
  };
}