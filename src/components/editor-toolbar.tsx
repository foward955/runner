"use client";

import { Button } from "@/components/ui/button";
import {
  Download,
  FileCode,
  Ban,
  Moon,
  Package,
  Play,
  Share2,
  Sun /* , Trash2 */,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
  packagesCount: number;
  editorTheme: "vs-dark" | "light";
  onRun: () => void;
  onTerminate: () => void;
  // onReset: () => void;
  onToggleTheme: () => void;
  onDownload: () => void;
  onOpenFile: () => void;
  onShare: () => void;
  togglePackage: () => void;
}

export function EditorToolbar({
  packagesCount,
  editorTheme,
  onRun,
  onTerminate,
  // onReset,
  onToggleTheme,
  onOpenFile,
  onDownload,
  onShare,
  togglePackage,
}: EditorToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex gap-2">
          <Button onClick={onRun} size="sm" variant="secondary">
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>

          <Button onClick={onTerminate} size="sm" variant="secondary">
            <Ban className="w-4 h-4 mr-2" />
            Terminate
          </Button>

          {/* <Button onClick={onReset} variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset
                    </Button> */}
          <Button onClick={() => togglePackage()} variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            Packages ({packagesCount})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={onToggleTheme} variant="outline" size="sm">
            {editorTheme === "vs-dark" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Sun className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Light mode</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Moon className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dark mode</p>
                </TooltipContent>
              </Tooltip>
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onOpenFile} variant="outline" size="sm">
                <FileCode className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open File</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 " />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
