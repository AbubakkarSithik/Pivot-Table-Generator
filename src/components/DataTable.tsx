import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../lib/store";
import { generatePivot } from "@/lib/utils/pivotUtils";
import type { PivotResult } from "@/lib/types/type";

function computeRowSpans(
  rowCombinations: string[][],
  rowFields: string[]
): number[][] {
  const rowSpans: number[][] = rowCombinations.map(() =>
    new Array(rowFields.length).fill(1)
  );

  for (let level = 0; level < rowFields.length; level++) {
    let start = 0;
    while (start < rowCombinations.length) {
      let end = start + 1;
      while (
        end < rowCombinations.length &&
        rowCombinations[end][level] === rowCombinations[start][level] &&
        rowCombinations[end].slice(0, level).join("||") ===
          rowCombinations[start].slice(0, level).join("||")
      ) {
        end++;
      }
      rowSpans[start][level] = end - start;
      for (let k = start + 1; k < end; k++) {
        rowSpans[k][level] = 0;
      }
      start = end;
    }
  }
  return rowSpans;
}

// A helper to format numbers appropriately (integers for counts, decimals for others)
function formatValue(value: number | null | undefined): string {
    if (value === null || value === undefined) return "";
    if (Number.isInteger(value)) {
        return value.toString();
    }
    return value.toFixed(2);
}

const DataTable: React.FC = () => {
  const dataState = useSelector((state: RootState) => state.data);

  const pivot: PivotResult = generatePivot(dataState);

  const {
    rowFields,
    colFields,
    valueFields,
    rowCombinations,
    colCombinations,
    matrix,
    wasImplicit, // The new flag from our utility
  } = pivot;

  const hasRows = rowFields.length > 0;
  const hasCols = colFields.length > 0;
  // valueFields will now always have at least 'Count', so hasValues is always true.
  const numValueSlots = valueFields.length;

  console.log({rowFields, colFields, valueFields, rowCombinations, colCombinations, matrix, wasImplicit});
  if (!hasRows && !hasCols && wasImplicit) {
    return (
      <div className="p-6 text-gray-600">
        Drag and drop fields to build your pivot table.
      </div>
    );
  }

  const rowSpans = computeRowSpans(rowCombinations, rowFields);

  // Totals will now be calculated based on the effective values (or counts)
  const rowTotals = rowCombinations.map((_, ri) =>
    (matrix[ri] ?? []).reduce(
      (rowAcc, cell) => rowAcc + ((cell ?? []).reduce((cellAcc, v) => (cellAcc ?? 0) + (v ?? 0), 0) ?? 0), 0
    )
  );
  const colTotals = colCombinations.map((_, ci) =>
    matrix.reduce((colAcc, row) => colAcc + (((row?.[ci] ?? []).reduce((cellAcc, v) => (cellAcc ?? 0) + (v ?? 0), 0)) ?? 0), 0)
  );
  const grandTotal = colTotals.reduce((acc, total) => acc + total, 0);

  return (
    <div className="overflow-auto max-h-[560px] h-full hide-scroll bg-white rounded-xl border border-gray-300">
      <table className="min-w-full border-collapse">
        <thead>
          {hasCols && colFields.map((_, level) => {
            const merged: { value: string; span: number }[] = [];
            let i = 0;
            while (i < colCombinations.length) {
              const val = colCombinations[i][level] ?? "";
              let span = numValueSlots;
              let j = i + 1;
              while (j < colCombinations.length && colCombinations[j][level] === val && colCombinations[j].slice(0, level).join('||') === colCombinations[i].slice(0, level).join('||')) {
                span += numValueSlots;
                j++;
              }
              merged.push({ value: val, span });
              i = j;
            }
            return (
              <tr key={`col-header-${level}`}>
                {level === 0 && hasRows && rowFields.map((rf, ri) => (
                  <th key={`rowfield-${ri}`} rowSpan={colFields.length + 1} className="border px-3 py-2 bg-gray-50 text-sm select-none">
                    {rf}
                  </th>
                ))}
                {merged.map((m, mi) => (
                  <th key={`mh-${level}-${mi}`} colSpan={m.span} className="border px-3 py-2 bg-gray-100 text-sm text-center">
                    {m.value === "" ? "(blank)" : m.value}
                  </th>
                ))}
                {level === 0 && (
                  <th rowSpan={colFields.length + 1} className="border px-3 py-2 bg-gray-200 text-sm">
                    Grand Total
                  </th>
                )}
              </tr>
            );
          })}

          <tr>
            {!hasCols && hasRows && rowFields.map((rf, ri) => (
              <th key={`rowfield-simple-${ri}`} className="border px-3 py-2 bg-gray-50 text-sm select-none">{rf}</th>
            ))}
            {colCombinations.map((_, ci) =>
              valueFields.map((vf, vi) => (
                <th key={`vf-${ci}-${vi}`} className="border px-3 py-2 bg-gray-100 text-sm">
                  {/* Hide the 'Count' header if it was implicitly added */}
                  {wasImplicit ? '' : vf}
                </th>
              ))
            )}
             {!hasCols && <th className="border px-3 py-2 bg-gray-200 text-sm">Grand Total</th>}
          </tr>
        </thead>
        <tbody>
          {rowCombinations.map((rowParts, ri) => (
            <tr key={`row-${ri}`}>
              {rowParts.map((part, pi) => {
                const span = rowSpans[ri][pi];
                if (span === 0) return null;
                return (
                  <td key={`rl-${ri}-${pi}`} rowSpan={span} className="border px-3 py-2 bg-gray-50 text-sm align-middle">
                    {part === "" ? "(blank)" : part}
                  </td>
                );
              })}
              {colCombinations.map((_, ci) =>
                valueFields.map((_, vi) => {
                  const val = matrix[ri]?.[ci]?.[vi];
                  return (
                    <td key={`cell-${ri}-${ci}-${vi}`} className="border px-3 py-2 text-right">
                      {/* If count was implicit, render an empty cell as requested */}
                      {wasImplicit ? "" : formatValue(val)}
                    </td>
                  );
                })
              )}
              <td className="border px-3 py-2 text-right bg-gray-200 font-semibold">
                {wasImplicit ? "" : formatValue(rowTotals[ri])}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-semibold">
            <td colSpan={rowFields.length > 0 ? rowFields.length : 1} className="border px-3 py-2 text-left">
              Grand Total
            </td>
            {colCombinations.map((_, ci) => (
              <td key={`col-total-${ci}`} colSpan={numValueSlots} className="border px-3 py-2 text-right">
                {wasImplicit ? "" : formatValue(colTotals[ci])}
              </td>
            ))}
            <td className="border px-3 py-2 text-right">
              {wasImplicit ? "" : formatValue(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;