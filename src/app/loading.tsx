import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-2 border-brand-red/20 border-t-brand-red animate-spin" />
        <div className="absolute font-serif text-xs font-bold text-brand-gold">
          SC
        </div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] font-semibold text-gray-400">
        Simmering Fresh &bull; Sika Cuisine
      </p>
    </div>
  );
}
