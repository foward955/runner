"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, X, Circle } from "lucide-react";
import { useRef } from "react";

interface EditorTabProps {
  id: string;
  name: string;
  isActive: boolean;
  isEditingName: boolean;
  isContentChanged: boolean;
  onActivate: () => void;
  onClose: (event: React.MouseEvent) => void;
  saveCode: (event: React.MouseEvent) => void;
  onStartRename: (event: React.MouseEvent) => void;
  onRename: (newName: string) => void;
  onCancelRename: () => void;
}

export function EditorTab({
  // id,
  name,
  isActive,
  isEditingName,
  isContentChanged,
  onActivate,
  onClose,
  saveCode,
  onStartRename,
  onRename,
  onCancelRename,
}: EditorTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRenameKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      onRename(event.currentTarget.value);
    } else if (event.key === "Escape") {
      onCancelRename();
    }
  };

  return (
    <div
      className={`flex items-center px-4 py-2 cursor-pointer border-r select-none rounded-t ${
        isActive ? "bg-secondary" : "hover:bg-muted"
      }`}
      onClick={() => !isEditingName && onActivate()}
      onDoubleClick={onStartRename}
    >
      {isEditingName ? (
        <Input
          ref={inputRef}
          className="h-5 w-32 px-1 py-0"
          defaultValue={name.replace(/\.js$/, "")}
          onBlur={(e) => onRename(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          autoFocus
          onFocus={(e) => e.target.select()}
        />
      ) : (
        <>
          <span className="mr-2 text-sm">{name}</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-muted transition duration-200 ease-in-out transform hover:scale-110"
              onClick={onStartRename}
            >
              <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary transition duration-200 ease-in-out" />
            </Button>

            {isContentChanged ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 transition duration-200 ease-in-out transform"
                onClick={saveCode}
              >
                <Circle className="h-3 w-3 bg-white rounded-lg transition duration-200 ease-in-out" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-muted transition duration-200 ease-in-out transform hover:scale-150"
                onClick={onClose}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition duration-200 ease-in-out" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
