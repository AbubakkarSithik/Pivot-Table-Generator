import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { setFilterValue } from "@/lib/store/slices/dataSlice";
import { RiFilter3Fill } from "@remixicon/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const FilterBar: React.FC = () => {
  const dispatch = useDispatch();
  const { data, filters, filterValues, sidebarOpen } = useSelector(
    (state: RootState) => state.data
  );

  const uniqueValues: Record<string, string[]> = {};
  filters.forEach((field) => {
    uniqueValues[field] = Array.from(
      new Set(
        data
          .map((d) =>
            d[field] === undefined || d[field] === null || d[field] === ""
              ? "__blank__"
              : String(d[field])
          )
      )
    );
  });

  return (
    <div
      className={` h-full text-white transition-transform duration-300 ease-in-out shadow-2xl  p-6 flex flex-col gap-4`}
      style={{
        width: `420px`,
        transform: sidebarOpen
          ? `translateX(0)`
          : `translateX(-420px)`,
      }}
    >
      <div className="flex items-center gap-2 text-xl font-bold mb-2">
        <RiFilter3Fill size={22} />
        Filters
      </div>

      {filters.map((field) => (
        <div key={field} className="flex flex-col text-sm">
          <label className="font-medium mb-1">{field}</label>
          <Select
            value={
              filterValues[field] === null || filterValues[field] === undefined
                ? "__all__"
                : filterValues[field] === ""
                ? "__blank__"
                : String(filterValues[field])
            }
            onValueChange={(value) =>
              dispatch(
                setFilterValue({
                  field,
                  value:
                    value === "__all__"
                      ? null
                      : value === "__blank__"
                      ? ""
                      : value,
                })
              )
            }
          >
            <SelectTrigger className="w-full bg-white text-black">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {uniqueValues[field].map((v, idx) => (
                <SelectItem key={`${field}-${idx}-${v}`} value={v}>
                  {v === "__blank__" ? "(blank)" : v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
};

export default FilterBar;
