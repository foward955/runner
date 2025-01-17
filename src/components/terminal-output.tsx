"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { forwardRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface TerminalOutputProps {
    output: string;
}

export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(({ output }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(output);
            toast.success("Result copied to clipboard!");
        } catch (error) {
            console.error("Error copying:", error);
        }
    };

    return (
        <TooltipProvider>
            <div 
                ref={ref}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="h-[calc(100%-4rem)]"
            >
                <ScrollArea className="h-full p-4 relative">
                    {isHovered && (
                        <div
                            className="absolute top-2 right-6 z-10 cursor-pointer bg-gray-800 py-1 px-2 rounded-sm hover:bg-gray-700 hover:scale-101 transition-all duration-200"
                            onClick={copyCode}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex">
                                        <Copy className="w-4 h-4 mr-1" />
                                        <span className="text-xs transition-colors duration-200">
                                            Copy code
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copy result</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                    <pre className="font-mono text-sm whitespace-pre-wrap break-words p-4 rounded-lg">
                        {output || "Console output will appear here..."}
                    </pre>
                </ScrollArea>
            </div>
        </TooltipProvider>
    );
});

TerminalOutput.displayName = "TerminalOutput";