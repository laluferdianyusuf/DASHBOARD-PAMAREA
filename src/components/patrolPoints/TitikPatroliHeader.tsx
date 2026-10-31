import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

interface Props {
  isFetching: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export const TitikPatroliHeader = ({ isFetching, onRefresh, onAdd }: Props) => {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Manajemen Titik Patroli
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Kelola lokasi checkpoint dan penautan NFC.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded"
          disabled={isFetching}
          onClick={onRefresh}
        >
          <RefreshCw
            className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        <Button
          size="sm"
          className="h-9 rounded bg-[#FED400] text-black hover:bg-[#e9c300]"
          onClick={onAdd}
        >
          <Plus className="mr-1.5 size-4" />
          Tambah Titik
        </Button>
      </div>
    </div>
  );
};
