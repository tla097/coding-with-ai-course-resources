import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TopBar() {
  return (
    <header className="flex items-center border-b border-border px-4 py-3">
      <div className="flex flex-1 items-center">
        <span className="text-lg font-bold tracking-tight">DevStash</span>
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items..." className="pl-9" />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          New Collection
        </Button>
        <Button size="sm">New Item</Button>
      </div>
    </header>
  );
}
