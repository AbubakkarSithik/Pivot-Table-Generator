import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../lib/store";
import { generatePivot } from "@/lib/utils/pivotUtils";
import type { PivotResult } from "@/lib/types/type";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 

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

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

const DataTable: React.FC = () => {
  const dataState = useSelector((state: RootState) => state.data);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pivot: PivotResult = generatePivot(dataState);

  const {
    rowFields,
    colFields,
    valueFields,
    rowCombinations,
    colCombinations,
    matrix,
    wasImplicit,
  } = pivot;

  const hasRows = rowFields.length > 0;
  const hasCols = colFields.length > 0;
  const numValueSlots = valueFields.length;

  if (!hasRows && !hasCols && wasImplicit) {
    return (
      <div className="p-6 text-gray-600">
        Drag and drop fields to build your pivot table.
      </div>
    );
  }

  
  const totalRows = rowCombinations.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRowCombinations = rowCombinations.slice(startIndex, endIndex);
  const paginatedMatrix = matrix.slice(startIndex, endIndex);
  const rowSpans = computeRowSpans(paginatedRowCombinations, rowFields);

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
        (((row?.[ci] ?? []).reduce(
          (cellAcc, v) => (cellAcc ?? 0) + (v ?? 0),
          0
        )) ?? 0),
      0
    )
  );
  const grandTotal = colTotals.reduce((acc, total) => acc + total, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-auto max-h-[560px] h-full hide-scroll bg-white rounded-xl border border-gray-300">
        <table className="min-w-full border-collapse">
          <thead>
            {hasCols &&
              colFields.map((_, level) => {
                const merged: { value: string; span: number }[] = [];
                let i = 0;
                while (i < colCombinations.length) {
                  const val = colCombinations[i][level] ?? "";
                  let span = numValueSlots;
                  let j = i + 1;
                  while (
                    j < colCombinations.length &&
                    colCombinations[j][level] === val &&
                    colCombinations[j].slice(0, level).join("||") ===
                      colCombinations[i].slice(0, level).join("||")
                  ) {
                    span += numValueSlots;
                    j++;
                  }
                  merged.push({ value: val, span });
                  i = j;
                }
                return (
                  <tr key={`col-header-${level}`}>
                    {level === 0 &&
                      hasRows &&
                      rowFields.map((rf, ri) => (
                        <th
                          key={`rowfield-${ri}`}
                          rowSpan={colFields.length + 1}
                          className="border px-3 py-2 bg-gray-50 text-sm select-none"
                        >
                          {rf}
                        </th>
                      ))}
                    {merged.map((m, mi) => (
                      <th
                        key={`mh-${level}-${mi}`}
                        colSpan={m.span}
                        className="border px-3 py-2 bg-gray-100 text-sm text-center"
                      >
                        {m.value === "" ? "(blank)" : m.value}
                      </th>
                    ))}
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

            <tr>
              {!hasCols &&
                hasRows &&
                rowFields.map((rf, ri) => (
                  <th
                    key={`rowfield-simple-${ri}`}
                    className="border px-3 py-2 bg-gray-50 text-sm select-none"
                  >
                    {rf}
                  </th>
                ))}
              {colCombinations.map((_, ci) =>
                valueFields.map((vf, vi) => (
                  <th
                    key={`vf-${ci}-${vi}`}
                    className="border px-3 py-2 bg-gray-100 text-sm"
                  >
                    {wasImplicit ? "" : vf}
                  </th>
                ))
              )}
              {!hasCols && (
                <th className="border px-3 py-2 bg-gray-200 text-sm">
                  Grand Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedRowCombinations.map((rowParts, ri) => (
              <tr key={`row-${ri}`}>
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
                {colCombinations.map((_, ci) =>
                  valueFields.map((_, vi) => {
                    const val = paginatedMatrix[ri]?.[ci]?.[vi];
                    return (
                      <td
                        key={`cell-${ri}-${ci}-${vi}`}
                        className="border px-3 py-2 text-right"
                      >
                        {wasImplicit ? "" : formatValue(val)}
                      </td>
                    );
                  })
                )}
                <td className="border px-3 py-2 text-right bg-gray-200 font-semibold">
                  {wasImplicit ? "" : formatValue(rowTotals[startIndex + ri])}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-200 font-semibold">
              <td
                colSpan={rowFields.length > 0 ? rowFields.length : 1}
                className="border px-3 py-2 text-left"
              >
                Grand Total
              </td>
              {colCombinations.map((_, ci) => (
                <td
                  key={`col-total-${ci}`}
                  colSpan={numValueSlots}
                  className="border px-3 py-2 text-right"
                >
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 text-nowrap ml-1">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1); 
            }}
          >
            <SelectTrigger className="w-fit cursor-pointer bg-white border-[#e5e5e5] border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>

       <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className="cursor-pointer"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              />
            </PaginationItem>
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 4 && <PaginationEllipsis />}
              </>
            )}
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(
                (page) =>
                  page >= currentPage - 2 &&
                  page <= currentPage + 2 &&
                  page !== 1 &&
                  page !== totalPages
              )
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <PaginationEllipsis />}
                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex items-center justify-center mr-1 text-nowrap">
          <span className="text-sm text-gray-800">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataTable;