"use client";

import { Button } from "@/components/ui/button";

import {
  Terminal,
  Trash2,
  //  Circle
} from "lucide-react";

interface TerminalHeaderProps {
  onClear: () => void;
}

export function TerminalHeader({ onClear }: TerminalHeaderProps) {
  return (
    <div className="p-3 border-b bg-background/95 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Console Output</h2>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={onClear} variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
