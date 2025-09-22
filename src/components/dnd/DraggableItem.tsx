import React from "react";
import type { ColumnItem , AggregatorType } from "@/lib/types/type";
import { useDraggable } from "@dnd-kit/core";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { updateValueAggregator } from "@/lib/store/slices/dataSlice";


const DraggableItem: React.FC<{ id: string; col: ColumnItem; zone: string }> = ({
  id,
  col,
  zone,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const dispatch = useDispatch();
  const valuesCols = useSelector((state: RootState) => state.data.values);

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 999 : undefined,
  } as React.CSSProperties;

  const current = valuesCols.find((v) => v.field === col.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-2 p-2 rounded-md border flex justify-between items-center gap-2 border-gray-600 text-sm cursor-grab ${isDragging ? "bg-gray-500 shadow-lg cursor-grabbing" : "bg-gray-600"
        }`}
    >
      <div className="font-medium text-gray-200 truncate text-sm">
        {col.name}
      </div>

      {zone === "values" ? (
        <select
          value={current?.aggregator ?? "sum"}
          onChange={(e) =>
            dispatch(
              updateValueAggregator({
                field: col.name,
                aggregator: e.target.value as AggregatorType,
              })
            )
          }
          className="bg-gray-700 border border-gray-500 text-xs text-gray-200 rounded px-2 py-1"
        >
          <option value="sum">Sum</option>
          <option value="count">Count</option>
          <option value="avg">Average</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
        </select>
      ) : (
        <div className="text-xs text-gray-400 uppercase">{col.type}</div>
      )}
    </div>
  );
};

export default DraggableItem;