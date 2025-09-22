import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setRows, setCols, setValues, setFilters } from "../../lib/store/slices/dataSlice";
import type { ColumnItem } from "@/lib/types/type";
import { arrayMove } from '@dnd-kit/sortable';
import {type DragEndEvent , DndContext,closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { RootState } from "../../lib/store";
import DroppableZone from "../dnd/DroppableZone";
import { RiLayoutColumnLine, RiFilter2Line, RiDragDropFill, RiLayoutRowLine, RiInputField, RiFunctions} from "@remixicon/react";


const PivotTools: React.FC = () => {
    const dispatch = useDispatch();
    const reduxColumns = useSelector((state: RootState) => state.data.columns);
    const rowsCols = useSelector((state: RootState) => state.data.rows);
    const colsCols = useSelector((state: RootState) => state.data.cols);
    const valuesCols = useSelector((state: RootState) => state.data.values);
    const filtersCols = useSelector((state: RootState) => state.data.filters);
    const usedCols = new Set<string>([
        ...rowsCols,
        ...colsCols,
        ...valuesCols.map((v) => v.field),
        ...filtersCols,
    ]);
    const sourceCols: ColumnItem[] = reduxColumns
        .filter((c) => !usedCols.has(c.name))
        .map((c) => ({ name: c.name, type: c.type }));
    const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: { distance: 5 },
        })
      );

   const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const [activeZone, activeName] = active.id.toString().split(":");
    const [overZone, overName] = over.id.toString().split(":");

    if (activeZone === overZone) {
      let from, to;
      switch (activeZone) {
        case "rows":
          from = rowsCols.indexOf(activeName);
          to = rowsCols.indexOf(overName);
          if (from !== -1 && to !== -1) {
            dispatch(setRows(arrayMove(rowsCols, from, to)));
          }
          break;
        case "cols":
          from = colsCols.indexOf(activeName);
          to = colsCols.indexOf(overName);
          if (from !== -1 && to !== -1) {
            dispatch(setCols(arrayMove(colsCols, from, to)));
          }
          break;
        case "values":
          from = valuesCols.findIndex(v => v.field === activeName);
          to = valuesCols.findIndex(v => v.field === overName);
          if (from !== -1 && to !== -1) {
            dispatch(setValues(arrayMove(valuesCols, from, to)));
          }
          break;
        case "filters":
          from = filtersCols.indexOf(activeName);
          to = filtersCols.indexOf(overName);
          if (from !== -1 && to !== -1) {
            dispatch(setFilters(arrayMove(filtersCols, from, to)));
          }
          break;
      }
      return;
    }

    // Moving between different zones
    const fieldToAdd = reduxColumns.find(c => c.name === activeName);
    if (!fieldToAdd) return;

    if (activeZone !== "source" && overZone !== "filters") {
      switch (activeZone) {
        case "rows":
          dispatch(setRows(rowsCols.filter(c => c !== activeName)));
          break;
        case "cols":
          dispatch(setCols(colsCols.filter(c => c !== activeName)));
          break;
        case "values":
          dispatch(setValues(valuesCols.filter(v => v.field !== activeName)));
          break;
        case "filters":
          dispatch(setFilters(filtersCols.filter(c => c !== activeName)));
          break;
      }
    }
    
    // Add to the destination zone
    switch (overZone) {
      case "rows":
        dispatch(setCols(colsCols.filter(c => c !== activeName)));
        dispatch(setValues(valuesCols.filter(v => v.field !== activeName)));
        dispatch(setRows([...rowsCols, activeName]));
        break;
      case "cols":
        dispatch(setRows(rowsCols.filter(c => c !== activeName)));
        dispatch(setValues(valuesCols.filter(v => v.field !== activeName)));
        dispatch(setCols([...colsCols, activeName]));
        break;
      case "values":
        dispatch(setRows(rowsCols.filter(c => c !== activeName)));
        dispatch(setCols(colsCols.filter(c => c !== activeName)));
        const aggregator = fieldToAdd.type === "string" ? "count" : "sum";
        dispatch(setValues([...valuesCols, { field: activeName, aggregator: aggregator }]));
        break;
      case "filters":
        if (!filtersCols.includes(activeName)) {
          dispatch(setFilters([...filtersCols, activeName]));
        }
        break;
      case "source":
        dispatch(setRows(rowsCols.filter(c => c !== activeName)));
        dispatch(setCols(colsCols.filter(c => c !== activeName)));
        dispatch(setValues(valuesCols.filter(v => v.field !== activeName)));
        dispatch(setFilters(filtersCols.filter(c => c !== activeName)));
        break;
    }
  }; 

  return(
    <div className="flex flex-col h-full">
            <div className="px-4 pt-6 pb-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Pivot Table Fields</h2>
              <p className="text-sm text-gray-300 mt-1">
                Choose the fields to add to table
              </p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="p-4 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-sm text-gray-300 mb-2 text-left flex gap-2">
                    <RiInputField size={18} />
                    Available Fields:
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                    <DroppableZone zoneId="source" items={sourceCols} />
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-2 text-left flex gap-2">
                  <RiDragDropFill size={18} /> Drag Fields between areas below:
                </p>
                <div className="grid grid-cols-2 gap-4 ">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1 flex gap-2">
                      <RiLayoutColumnLine size={18} />
                      Columns
                    </h4>
                    <DroppableZone
                      zoneId="cols"
                      items={colsCols.map((c) => {
                        const col = reduxColumns.find((rc) => rc.name === c);
                        return { name: c, type: col ? col.type : "unknown" };
                      })}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1 flex gap-2">
                      <RiLayoutRowLine size={18} />
                      Rows
                    </h4>
                    <DroppableZone
                      zoneId="rows"
                      items={rowsCols.map((c) => {
                        const col = reduxColumns.find((rc) => rc.name === c);
                        return { name: c, type: col ? col.type : "unknown" };
                      })}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1 flex gap-2">
                      <RiFunctions size={18} />
                      Values
                    </h4>
                    <DroppableZone
                      zoneId="values"
                      items={valuesCols.map((v) => {
                        const col = reduxColumns.find((rc) => rc.name === v.field);
                        return { name: v.field, type: col ? col.type : "unknown" };
                      })}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1 flex gap-2">
                      <RiFilter2Line size={18} />
                      Filters
                    </h4>
                    <DroppableZone
                      zoneId="filters"
                      items={filtersCols.map((c) => {
                        const col = reduxColumns.find((rc) => rc.name === c);
                        return { name: c, type: col ? col.type : "unknown" };
                      })}
                    />
                  </div>
                </div>
              </div>
            </DndContext>
          </div>
  )
}

export default PivotTools; 