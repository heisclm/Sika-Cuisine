"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  title = "Unable to load content",
  message,
  onRetry,
  className = "",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-3xl border border-[#FB7185]/35 bg-[#1C1C1C] px-6 py-12 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FB7185]/15 text-[#FDA4AF]">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-lg font-bold text-[#F5F1EA]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-[#A3A3A3]">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}
