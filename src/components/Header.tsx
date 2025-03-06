'use client';

import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sun, Moon, Filter } from "lucide-react";

interface HeaderProps {
  languages: string[];
}

export default function Header({ languages }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");

  const filterByLanguage = (language: string) => {
    window.location.href = `/?locale=${language}`;
  };

  return (
    <header className="bg-background text-foreground p-4 shadow-md flex flex-col sm:flex-row items-center justify-between">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold">FiveM Tracker</h1>
        <p className="text-muted-foreground">Unlock the power of FiveM</p>
      </div>

      <div className="mt-4 sm:mt-0 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <Input placeholder="Search country..." onChange={(e) => setSearch(e.target.value.toLowerCase())} />
            <div className="mt-2 max-h-40 overflow-y-auto">
              { 
                languages
                  .filter((x) => String(x).toLowerCase().includes(search))
                  .map((language) => (
                    <DropdownMenuItem key={language} onClick={() => filterByLanguage(language)}>
                      {language}
                    </DropdownMenuItem>
                  ))
              }
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>  
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
};
