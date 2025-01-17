"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PackageManager({ onInstall }: { onInstall: (pkg: string) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPackages = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(search)}&size=10`);
      const data = await res.json();
      setResults(data.objects);
    } catch (error) {
      console.error("Failed to search packages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search npm packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchPackages()}
        />
        <Button onClick={searchPackages} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {results.map((pkg) => (
            <Card key={pkg.package.name}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {pkg.package.name}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onInstall(pkg.package.name)}
                  >
                    Install
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pkg.package.version}
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm">{pkg.package.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}