import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setRows, setCols, setValues, setFilters, toggleSidebar } from "../../lib/store/slices/dataSlice";
import type { ColumnItem } from "@/lib/types/type";
import { arrayMove } from '@dnd-kit/sortable';
import { type DragEndEvent, DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import type { RootState } from "../../lib/store";
import DroppableZone from "../dnd/DroppableZone";
import { RiLayoutColumnLine, RiFilter2Line, RiDragDropFill, RiLayoutRowLine, RiInputField, RiFunctions, RiCloseLine } from "@remixicon/react";
import { Button } from "../ui/button";

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
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const [activeItem, setActiveItem] = useState<ColumnItem | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null); // clear overlay
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
        dispatch(setValues([...valuesCols, { field: activeName, aggregator }]));
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

  const handleDelete = (zone: string, name: string) => {
    switch (zone) {
      case "rows":
        dispatch(setRows(rowsCols.filter(c => c !== name)));
        break;
      case "cols":
        dispatch(setCols(colsCols.filter(c => c !== name)));
        break;
      case "values":
        dispatch(setValues(valuesCols.filter(v => v.field !== name)));
        break;
      case "filters":
        dispatch(setFilters(filtersCols.filter(c => c !== name)));
        break;
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="sticky bg-gray-800 top-0 left-0 w-full px-4 pt-6 pb-3 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Pivot Table Fields</h2>
        <p className="text-sm text-gray-300 mt-1">Choose the fields to add to table</p>
        <Button
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white text-black shadow-md z-[999] cursor-pointer"
          onClick={() => dispatch(toggleSidebar())}
          variant="outline"
        >
          <RiCloseLine size={22} />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => {
          const [_, name] = e.active.id.toString().split(":");
          const col = reduxColumns.find(c => c.name === name);
          if (col) setActiveItem({ name: col.name, type: col.type });
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="p-4 flex flex-col h-full ">
          <div className="mb-4">
            <h3 className="text-sm text-gray-300 mb-2 flex gap-2">
              <RiInputField size={18} />
              Available Fields:
            </h3>
            <DroppableZone zoneId="source" items={sourceCols} />
          </div>

          <p className="text-sm text-gray-300 mb-2 flex gap-2">
            <RiDragDropFill size={18} /> Drag Fields between areas below:
          </p>
          <div className="grid grid-cols-2 gap-4 ">
            {[
              { id: "cols", label: "Columns", icon: <RiLayoutColumnLine size={18} />, items: colsCols },
              { id: "rows", label: "Rows", icon: <RiLayoutRowLine size={18} />, items: rowsCols },
              { id: "values", label: "Values", icon: <RiFunctions size={18} />, items: valuesCols.map(v => v.field) },
              { id: "filters", label: "Filters", icon: <RiFilter2Line size={18} />, items: filtersCols },
            ].map((zone) => (
              <div key={zone.id}>
                <h4 className="text-sm font-medium text-gray-300 mb-1 flex gap-2">{zone.icon}{zone.label}</h4>
                <DroppableZone
                  zoneId={zone.id}
                  items={zone.items.map((c) => {
                    const col = reduxColumns.find(rc => rc.name === (typeof c === "string" ? c : c));
                    return { name: typeof c === "string" ? c : c, type: col ? col.type : "unknown", deletable: true };
                  })}
                  onDelete={(name) => handleDelete(zone.id, name)}
                />
              </div>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeItem ? (
            <div className="p-1 rounded-md border flex justify-start items-center gap-2 border-gray-600 text-sm bg-gray-600 shadow-lg cursor-grabbing">
              <div className="font-medium text-gray-200 truncate text-sm">{activeItem.name}</div>
              <div className="text-xs text-gray-400 uppercase">{activeItem.type}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PivotTools;