import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { ColumnItem } from "@/lib/types/type";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableItem from "./DraggableItem";
import SortableDraggableItem from "./SortableDraggableItem";

interface DroppableZoneProps {
  zoneId: string;
  items: ColumnItem[];
  onDelete?: (name: string) => void;
}

const DroppableZone: React.FC<DroppableZoneProps> = ({ zoneId, items, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  const itemIds = items.map(item => `${zoneId}:${item.name}`);
  const isSortableZone = ["rows", "cols", "values", "filters"].includes(zoneId);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 rounded-lg border-2 border-dashed ${zoneId === "source" && "flex flex-wrap gap-x-1 overflow-x-hidden overflow-y-auto max-h-[150px]" }  ${
        isOver ? "bg-gray-600 border-blue-400" : "bg-gray-700 border-gray-500"
      }`}
    >
      {isSortableZone ? (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((col) => (
            <SortableDraggableItem
              key={`${zoneId}:${col.name}`}
              id={`${zoneId}:${col.name}`}
              col={col}
              zone={zoneId}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      ) : (
        items.map((col) => (
          <DraggableItem
            key={`${zoneId}:${col.name}`}
            id={`${zoneId}:${col.name}`}
            col={col}
            zone={zoneId}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default DroppableZone;
