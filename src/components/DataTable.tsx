import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../lib/store";
import { generatePivot } from "@/lib/utils/pivotUtils";
import type { PivotResult } from "@/lib/types/type";
import { RiArrowUpSLine, RiArrowDownSLine } from "@remixicon/react";

function buildMergedCells(values: string[]): { value: string; span: number }[] {
  const result: { value: string; span: number }[] = [];
  let i = 0;
  while (i < values.length) {
    let j = i + 1;
    while (j < values.length && values[j] === values[i]) j++;
    result.push({ value: values[i], span: j - i });
    i = j;
  }
  return result;
}

function computeRowSpans(
  rowCombinations: string[][],
  rowFields: string[]
): number[][] {
  const rowSpans: number[][] = rowCombinations.map(() =>
    new Array(rowFields.length).fill(1)
  );

  for (let colIdx = 0; colIdx < rowFields.length; colIdx++) {
    let start = 0;
    while (start < rowCombinations.length) {
      let end = start + 1;
      while (
        end < rowCombinations.length &&
        rowCombinations[end][colIdx] === rowCombinations[start][colIdx]
      ) {
        end++;
      }

      rowSpans[start][colIdx] = end - start;
      for (let k = start + 1; k < end; k++) {
        rowSpans[k][colIdx] = 0;
      }
      start = end;
    }
  }
  return rowSpans;
}

const DataTable: React.FC = () => {
  const dataState = useSelector((state: RootState) => state.data);

  const [sortRowIndex, setSortRowIndex] = useState<number | null>(null);
  const [sortRowDir, setSortRowDir] = useState<"asc" | "desc" | null>(null);
  const [sortColIndex, setSortColIndex] = useState<number | null>(null);
  const [sortColDir, setSortColDir] = useState<"asc" | "desc" | null>(null);

  const pivot: PivotResult = generatePivot(dataState, {
    sortRowIndex,
    sortRowDir,
    sortColIndex,
    sortColDir,
  });

  const {
    rowFields,
    colFields,
    valueFields,
    rowCombinations,
    colCombinations,
    matrix,
  } = pivot;

  if (valueFields.length === 0) {
    return (
      <div className="p-6 text-gray-600">
        Select at least one field in <strong>Values</strong> to render the pivot
        table.
      </div>
    );
  }

  // Precompute rowSpans
  const rowSpans = computeRowSpans(rowCombinations, rowFields);

  // Compute totals
  const rowTotals = rowCombinations.map((_, ri) =>
    (matrix[ri] ?? []).reduce(
      (rowAcc, cell) =>
        rowAcc +
        ((cell ?? []).reduce((cellAcc, v) => (cellAcc ?? 0) + (v ?? 0), 0) ?? 0),
      0
    )
  );
  const colTotals = colCombinations.map((_, ci) =>
    matrix.reduce(
      (colAcc, row) =>
        colAcc +
        (((row?.[ci] ?? []).reduce((cellAcc, v) => (cellAcc ?? 0) + (v ?? 0), 0)) ??
          0),
      0
    )
  );
  const grandTotal = matrix.reduce(
    (gAcc, row) =>
      gAcc +
      (row ?? []).reduce(
        (rowAcc, cell) =>
          rowAcc + ((cell ?? []).reduce((cellAcc, v) => (cellAcc ?? 0) + (v ?? 0), 0) ?? 0),
        0
      ),
    0
  );

  const toggleRowSort = (index: number) => {
    if (sortRowIndex !== index) {
      setSortRowIndex(index);
      setSortRowDir("asc");
    } else {
      setSortRowDir((prev) =>
        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
      );
      if (sortRowDir === null) setSortRowIndex(null);
    }
  };

  const toggleColSort = (index: number) => {
    if (sortColIndex !== index) {
      setSortColIndex(index);
      setSortColDir("asc");
    } else {
      setSortColDir((prev) =>
        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
      );
      if (sortColDir === null) setSortColIndex(null);
    }
  };

  return (
    <div className="overflow-auto max-h-[560px] h-full hide-scroll bg-white rounded-xl border border-gray-300">
      <table className="min-w-full border-collapse">
        <thead>
          {/* Column header levels */}
          {colFields.map((_, level) => {
            const levelValues = colCombinations.flatMap((colParts) =>
              valueFields.map(() => colParts[level] ?? "")
            );
            const merged = buildMergedCells(levelValues);

            return (
              <tr key={`col-header-${level}`}>
                {/* left side row field headers */}
                {rowFields.map((rf, i) =>
                  level === 0 ? (
                    <th
                      key={`rowfield-${i}`}
                      rowSpan={colFields.length + 1}
                      className="border px-3 py-2 bg-gray-50 text-sm cursor-pointer select-none"
                      onClick={() => toggleRowSort(i)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{rf}</span>
                        {sortRowIndex === i && sortRowDir === "asc" && (
                          <RiArrowUpSLine className="ml-1 text-blue-500" />
                        )}
                        {sortRowIndex === i && sortRowDir === "desc" && (
                          <RiArrowDownSLine className="ml-1 text-blue-500" />
                        )}
                      </div>
                    </th>
                  ) : null
                )}
                {merged.map((m, i) => (
                  <th
                    key={`ch-${level}-${i}`}
                    colSpan={m.span}
                    className="border px-3 py-2 bg-gray-100 text-sm text-center"
                  >
                    {m.value === "" ? "(blank)" : m.value}
                  </th>
                ))}
                {/* Extra cell for grand total col header */}
                {level === 0 && (
                  <th
                    rowSpan={colFields.length + 1}
                    className="border px-3 py-2 bg-gray-200 text-sm"
                  >
                    Grand Total
                  </th>
                )}
              </tr>
            );
          })}

          {/* Value field labels with col sort toggles */}
          <tr>
            {colCombinations.map((_, ci) =>
              valueFields.map((vf, vi) => (
                <th
                  key={`vf-${ci}-${vi}`}
                  className="border px-3 py-2 bg-gray-100 text-sm cursor-pointer select-none"
                  onClick={() => toggleColSort(ci)}
                >
                  <div className="flex items-center justify-between">
                    <span>{vf}</span>
                    {sortColIndex === ci && sortColDir === "asc" && (
                      <RiArrowUpSLine className="ml-1 text-blue-500" />
                    )}
                    {sortColIndex === ci && sortColDir === "desc" && (
                      <RiArrowDownSLine className="ml-1 text-blue-500" />
                    )}
                  </div>
                </th>
              ))
            )}
          </tr>
        </thead>

        <tbody>
          {rowCombinations.map((rowParts, ri) => (
            <tr key={`row-${ri}`}>
              {/* Row labels with rowSpan merging */}
              {rowParts.map((part, pi) => {
                const span = rowSpans[ri][pi];
                if (span === 0) return null;
                return (
                  <td
                    key={`rl-${ri}-${pi}`}
                    rowSpan={span}
                    className="border px-3 py-2 bg-gray-50 text-sm align-middle"
                  >
                    {part === "" ? "(blank)" : part}
                  </td>
                );
              })}

              {/* Data cells */}
              {colCombinations.map((_, ci) =>
                valueFields.map((_, vi) => {
                  const val = matrix[ri][ci][vi];
                  return (
                    <td
                      key={`cell-${ri}-${ci}-${vi}`}
                      className="border px-3 py-2 text-right"
                    >
                      {val === null ? "" : val.toFixed(2)}
                    </td>
                  );
                })
              )}

              {/* Row total */}
              <td className="border px-3 py-2 text-right bg-gray-200 font-semibold">
                {rowTotals[ri]?.toFixed(2)}
              </td>
            </tr>
          ))}

          {/* Grand totals row */}
          <tr className="bg-gray-200 font-semibold">
            <td
              colSpan={rowFields.length}
              className="border px-3 py-2 text-left"
            >
              Grand Total
            </td>
            {colCombinations.map((_, ci) => (
              <td
                key={`col-total-${ci}`}
                colSpan={valueFields.length}
                className="border px-3 py-2 text-right"
              >
                {colTotals[ci]?.toFixed(2)}
              </td>
            ))}
            <td className="border px-3 py-2 text-right">
              {grandTotal?.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;