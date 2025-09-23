import React from "react";
import type { ColumnItem, AggregatorType } from "@/lib/types/type";
import { useDispatch, useSelector } from "react-redux";
import { useSortable } from "@dnd-kit/sortable";
import type { RootState } from "@/lib/store";
import { updateValueAggregator } from "@/lib/store/slices/dataSlice";
import { CSS } from "@dnd-kit/utilities";
import { RiCloseLine } from "@remixicon/react";

const SortableDraggableItem: React.FC<{ id: string; col: ColumnItem; zone: string; onDelete?: (name: string) => void }> = ({
  id,
  col,
  zone,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const dispatch = useDispatch();
  const valuesCols = useSelector((state: RootState) => state.data.values);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
  } as React.CSSProperties;

  const current = valuesCols.find((v) => v.field === col.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-2 p-1 rounded-md border flex justify-between items-center gap-2 border-gray-600 text-sm cursor-grab ${
        isDragging ? "bg-gray-500 shadow-lg cursor-grabbing" : "bg-gray-600"
      }`}
    >
      <div className="font-medium text-gray-200 truncate text-sm">{col.name}</div>

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

      {zone !== "source" && onDelete && (
        <button
          className="text-gray-300 hover:text-red-500 cursor-pointer"
          onClick={() => onDelete(col.name)}
        >
          <RiCloseLine size={16} />
        </button>
      )}
    </div>
  );
};

export default SortableDraggableItem;