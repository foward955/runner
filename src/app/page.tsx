import { CodeEditor } from "@/components/code-editor";
// import { Terminal as TerminalIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-2 md:p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <TerminalIcon className="w-6 h-6 md:w-8 md:h-8" />
                        <h1 className="text-xl md:text-2xl font-bold">JavaScript Playground</h1>
                    </div>
                </div> */}

        <div className="h-[calc(100vh-6rem)]">
          <CodeEditor />
        </div>
      </div>
    </main>
  );
}
