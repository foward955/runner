"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { sep, resolve as pathResolve } from "@tauri-apps/api/path";

import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditorTab } from "./editor-tab";
import { EditorToolbar } from "./editor-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import _ from "lodash";
// import axios from "axios";
// import moment from "moment";
// import dayjs from "dayjs";
// import chalk from "chalk";
// import * as R from "ramda";
import { TerminalHeader } from "./terminal-header";
import { EditorTabsScrollArea } from "./EditorTabsScrollArea";
import { TerminalOutput } from "./terminal-output";

interface FileTab {
  id: string;
  name: string;
  content: string;
  isEditing?: boolean;
  isContentChanged: boolean;
  filePath?: string;
}

const defaultCode = `// 🎉 Welcome to JavaScript Playground 🎉
// Write, experiment, and have fun!`;

const AVAILABLE_PACKAGES = {
  // axios: axios,
  // lodash: _,
  // moment: moment,
  // dayjs: dayjs,
  // chalk: chalk,
  // ramda: R,
};

interface ConsoleOutput {
  unlistenConsoleMessage?: UnlistenFn;
  unlistenConsoleFinish?: UnlistenFn;
  unlistenToastMessage?: UnlistenFn;
  unlistenClearConsole?: UnlistenFn;
}

interface ToastMessage {
  type: string;
  msg: string;
}

enum ToastType {
  Info = "Info",
  Err = "Error",
}

export function CodeEditor() {
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark"
  );
  const [output, setOutput] = useState("");
  const [_error, setError] = useState("");
  const [packages, setPackages] = useState<string[]>([]);
  const [isPackageSheetOpen, setIsPackageSheetOpen] = useState(false);
  const outputRef = useRef<string[]>([]);

  const consoleOutputRef = useRef<ConsoleOutput>({});

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [nextTabId, setNextTabId] = useState(1);
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [isLoadingEditor, setIsLoadingEditor] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!consoleOutputRef.current.unlistenToastMessage) {
      listen<ToastMessage>("toast-message", (event) => {
        if (event.payload.type === ToastType.Info) {
          toast.info(event.payload.msg);
        }

        if (event.payload.type === ToastType.Err) {
          toast.error(event.payload.msg);
        }
      }).then((unlistenFnRef) => {
        consoleOutputRef.current.unlistenToastMessage = unlistenFnRef;
      });
    }

    if (!consoleOutputRef.current.unlistenConsoleMessage) {
      listen("console-message", (event) => {
        customConsole.log(event.payload);
      }).then((unlistenFnRef) => {
        consoleOutputRef.current.unlistenConsoleMessage = unlistenFnRef;
      });
    }

    // if (!consoleOutputRef.current.unlistenConsoleFinish) {
    //   listen("console-finish", (_event) => {}).then((unlistenFnRef) => {
    //     consoleOutputRef.current.unlistenConsoleFinish = unlistenFnRef;
    //   });
    // }

    if (!consoleOutputRef.current.unlistenClearConsole) {
      listen("console-clear", (_event) => {
        clearTerminal();
      }).then((unlistenFnRef) => {
        consoleOutputRef.current.unlistenClearConsole = unlistenFnRef;
      });
    }

    return () => {
      consoleOutputRef.current.unlistenToastMessage?.();
      consoleOutputRef.current.unlistenConsoleMessage?.();
      consoleOutputRef.current.unlistenClearConsole?.();
      // consoleOutputRef.current.unlistenConsoleFinish?.();
      console.log("unlisten");
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 840);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTabs = localStorage.getItem("playground-tabs");
    const savedActiveTab = localStorage.getItem("playground-active-tab");
    const savedNextTabId = localStorage.getItem("playground-next-tab-id");

    if (savedTabs) {
      // update content
      async function updateTab(tabs: FileTab[]) {
        const newTabs = [];

        for (const tab of tabs) {
          if (tab.filePath) {
            const content: string | null = await invoke("read_file", {
              path: tab.filePath,
            });

            if (content) {
              tab.content = content;
              newTabs.push(tab);
            }
          }
        }

        return newTabs;
      }

      let tabs: FileTab[] = JSON.parse(savedTabs);

      updateTab(tabs).then((newTabs: FileTab[]) => {
        setTabs(newTabs);
      });
    } else {
      setTabs([
        {
          id: "tab-1",
          name: "main.js",
          content: defaultCode,
          isContentChanged: false,
        },
      ]);
    }

    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
    } else {
      setActiveTab("tab-1");
    }

    if (savedNextTabId) {
      setNextTabId(parseInt(savedNextTabId));
    }

    const savedPackages = localStorage.getItem("playground-packages");
    if (savedPackages) {
      setPackages(JSON.parse(savedPackages));
    }
  }, []);

  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem("playground-tabs", JSON.stringify(tabs));
      localStorage.setItem("playground-active-tab", activeTab);
      localStorage.setItem("playground-next-tab-id", nextTabId.toString());
    }
  }, [tabs, activeTab, nextTabId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [output]);

  const onSaveKeyDown = (activeTab: string, event: any) => {
    if (
      (event.key === "s" || event.key === "S") &&
      (event.metaKey || event.ctrlKey)
    ) {
      console.log("ctrl+s");
      saveCode(activeTab);
    }
  };

  const clearTerminal = () => {
    setOutput("");
    outputRef.current = [];
  };

  const toggleEditorTheme = () => {
    setEditorTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  const customConsole = {
    log: (...args: any[]) => {
      const formatted = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");
      outputRef.current = [...outputRef.current, formatted];
      setOutput(outputRef.current.join("\n"));
    },
    error: (...args: any[]) => {
      const formatted = args.map((arg) => String(arg)).join(" ");
      outputRef.current = [
        ...outputRef.current,
        `⚠️ ReferenceError: ${formatted}`,
      ];
      setOutput(outputRef.current.join("\n"));
      setError(formatted);
    },
    clear: () => {
      outputRef.current = [];
      setOutput("");
      setError("");
    },
  };

  const createSafePackageProxy = (pkgName: string): any => {
    return new Proxy(() => {}, {
      get: (_target, _prop) => {
        customConsole.error(
          `Package "${pkgName}" is not enabled. Enable it in the Packages menu.`
        );
        return createSafePackageProxy(pkgName);
      },
      apply: () => {
        customConsole.error(
          `Package "${pkgName}" is not enabled. Enable it in the Packages menu.`
        );
        return undefined;
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    setTabs((prev: any[]) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, content: value, isContentChanged: true }
          : tab
      )
    );
  };

  const addNewTab = () => {
    const newId = `tab-${nextTabId + 1}`;
    setNextTabId((prev) => prev + 1);
    const newTab = {
      id: newId,
      name: `untitled.js`,
      content: "// Start coding here\n",
      isContentChanged: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newId);
  };

  const closeTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (tabs.length > 1) {
      const newTabs = tabs.filter((tab) => tab.id !== tabId);
      setTabs(newTabs);
      if (activeTab === tabId) {
        setActiveTab(newTabs[0].id);
      }
    }
  };

  const saveCode = async (tabId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const currentTab = tabs.find((tab) => tab.id === tabId);

    if (currentTab) {
      if (!currentTab.filePath) {
        await downloadCode();
      } else {
        await writeActiveTabContentToFile(currentTab);
      }
    }
  };

  const startRenaming = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        isEditing: tab.id === tabId,
      }))
    );
  };

  const handleRename = (tabId: string, newName: string) => {
    async function renameFile(oldPath: string, fileName: string) {
      const oldName = oldPath.slice(oldPath.lastIndexOf(sep()) + 1);

      if (oldName !== fileName) {
        const dir = oldPath.slice(0, oldPath.lastIndexOf(sep()));
        const filePath = await pathResolve(dir, fileName);

        await invoke("rename_file", {
          old: oldPath,
          to: filePath,
        });
        return filePath;
      }
    }

    if (newName.trim()) {
      const name = newName.endsWith(".js") ? newName : `${newName}.js`;
      const currentTab = tabs.find((tab) => tab.id === tabId);

      if (currentTab?.filePath) {
        renameFile(currentTab.filePath, name).then((filePath) => {
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === tabId
                ? {
                    ...tab,
                    name,
                    id: filePath ?? tab.id,
                    filePath: filePath ?? tab.filePath,
                    isEditing: false,
                  }
                : tab
            )
          );
        });
      }
    } else {
      cancelRename();
    }
  };

  const cancelRename = () => {
    setTabs((prev) => prev.map((tab) => ({ ...tab, isEditing: false })));
  };

  const getCurrentCode = () => {
    return tabs.find((tab) => tab.id === activeTab)?.content || "";
  };

  const shareCode = async () => {
    try {
      const currentCode = getCurrentCode();
      const shareData = {
        title: "Check out this code!",
        text: currentCode,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Code shared successfully!");
      } else {
        await navigator.clipboard.writeText(currentCode);
        toast.success("Code copied to clipboard!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to share code");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentCode());
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const writeActiveTabContentToFile = async (activeTab: FileTab) => {
    if (!activeTab.filePath) {
      return;
    }

    // rename
    let filePath = activeTab.filePath;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab.id
          ? {
              ...tab,
              isContentChanged: false,
              filePath,
            }
          : tab
      )
    );

    // write to file
    let result = await invoke("write_file", {
      path: filePath,
      content: getCurrentCode(),
    });

    if (result) {
      toast.info(`save to: ${filePath} success.`);
    } else {
      toast.error(`save to: ${filePath} failed.`);
    }
  };

  const runCode = async () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);

    if (currentTab) {
      await invoke<{ S?: string; V?: string[] }>("run_js_script", {
        path: currentTab.filePath,
      });
    }
  };

  const terminateRun = async () => {
    await invoke("terminate_run_js_script");
  };

  const downloadCode = async () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);

    const dirPath = await open({
      multiple: false,
      directory: true,
    });

    if (dirPath && currentTab) {
      const filePath = await pathResolve(dirPath, currentTab.name);
      currentTab.filePath = filePath;
      setTabs((prev) =>
        prev.map((tab) => (tab.id === currentTab.id ? currentTab : tab))
      );
      await writeActiveTabContentToFile(currentTab);
    }
  };

  const openFile = async () => {
    // Open a dialog
    const filePath = await open({
      multiple: false,
      directory: false,
    });

    if (filePath) {
      const fileContent = await readTextFile(filePath);

      const name = filePath.slice(filePath.lastIndexOf(sep()) + 1);

      const newTab = {
        id: filePath,
        name,
        content: fileContent,
        filePath,
        isContentChanged: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(filePath);
    }
  };

  const togglePackage = () => {
    setIsPackageSheetOpen(true);
  };

  const handlePackageToggle = (pkg: string) => {
    setPackages((prev) => {
      const newPackages = prev.includes(pkg)
        ? prev.filter((p) => p !== pkg)
        : [...prev, pkg];
      localStorage.setItem("playground-packages", JSON.stringify(newPackages));
      return newPackages;
    });

    toast.success(
      packages.includes(pkg) ? `Package ${pkg} removed` : `Package ${pkg} added`
    );
  };

  const handleEditorBeforeMount = () => setIsLoadingEditor(false);

  return (
    <TooltipProvider>
      <ResizablePanelGroup
        direction={isMobile ? "vertical" : "horizontal"}
        className="h-full"
      >
        {/* rounded-lg border */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <EditorToolbar
              packagesCount={packages.length}
              editorTheme={editorTheme}
              onRun={runCode}
              onTerminate={terminateRun}
              onToggleTheme={toggleEditorTheme}
              onDownload={downloadCode}
              onOpenFile={openFile}
              onShare={shareCode}
              togglePackage={togglePackage}
            />
            <div className="border-b">
              <div className="flex items-center">
                <EditorTabsScrollArea>
                  {tabs.map((tab) => (
                    <EditorTab
                      key={tab.id}
                      id={tab.id}
                      name={tab.name}
                      isActive={activeTab === tab.id}
                      isEditingName={!!tab.isEditing}
                      isContentChanged={tab.isContentChanged}
                      onActivate={() => setActiveTab(tab.id)}
                      onClose={(e) => closeTab(tab.id, e)}
                      saveCode={(e) => saveCode(tab.id, e)}
                      onStartRename={(e) => startRenaming(tab.id, e)}
                      onRename={(newName) => handleRename(tab.id, newName)}
                      onCancelRename={cancelRename}
                    />
                  ))}
                </EditorTabsScrollArea>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 ml-1"
                      onClick={addNewTab}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New tab</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div
              className="flex-1 relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onKeyDown={(e) => onSaveKeyDown(activeTab, e)}
            >
              {!isLoadingEditor && isHovered && (
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
                      <p>Copy code</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme={editorTheme}
                value={getCurrentCode()}
                onChange={handleEditorChange}
                beforeMount={handleEditorBeforeMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: false,
                  scrollBeyondLastLine: true,
                  automaticLayout: true,
                  wordWrap: "on",
                  suggestOnTriggerCharacters: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full bg-black/5 dark:bg-white/5">
            <TerminalHeader onClear={clearTerminal} />
            <TerminalOutput output={output} ref={scrollAreaRef} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Sheet open={isPackageSheetOpen} onOpenChange={setIsPackageSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Available Packages</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="space-y-4">
              {Object.keys(AVAILABLE_PACKAGES).map((pkg) => (
                <div key={pkg} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pkg}</span>
                  <Button
                    size="sm"
                    variant={packages.includes(pkg) ? "destructive" : "outline"}
                    onClick={() => handlePackageToggle(pkg)}
                  >
                    {packages.includes(pkg) ? "Remove" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
