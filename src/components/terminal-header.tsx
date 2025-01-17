"use client";

import { Terminal, Circle } from "lucide-react";

export function TerminalHeader() {
    return (
        <div className="p-3 border-b bg-background/95 select-none">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">Console Output</h2>
                </div>
                <div className="flex gap-1.5">
                    <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Circle className="w-3 h-3 fill-green-400 text-green-400" />
                    <Circle className="w-3 h-3 fill-red-400 text-red-400" />
                </div>
            </div>
        </div>
    );
}
