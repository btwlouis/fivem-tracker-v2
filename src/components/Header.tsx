'use client';

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sun, Moon, Filter, SortAsc, RefreshCw } from "lucide-react";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [search, setSearch] = useState("");

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`/api/servers/languages`);
      const data = await res.json();
      setLanguages(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch languages:", error);
    }
  };

  const filterByLanguage = (language: string) => {
    window.location.href = `/?locale=${language}`;
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return (
    <header className="bg-background text-foreground p-4 shadow-md flex flex-col sm:flex-row items-center justify-between">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold">FiveM Tracker</h1>
        <p className="text-muted-foreground">Unlock the power of FiveM</p>
      </div>

      <div className="mt-4 sm:mt-0 flex gap-2">
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <Input placeholder="Search country..." onChange={(e) => setSearch(e.target.value.toLowerCase())} />
            <div className="mt-2 max-h-40 overflow-y-auto">
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : (
                languages
                  .filter((x) => String(x).toLowerCase().includes(search))
                  .map((language) => (
                    <DropdownMenuItem key={language} onClick={() => filterByLanguage(language)}>
                      {language}
                    </DropdownMenuItem>
                  ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Button */}
        <Button variant="outline" size="icon">
          <SortAsc className="h-5 w-5" />
        </Button>

        {/* Reset Filters Button */}
        <Button variant="outline" size="icon">
          <RefreshCw className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>  
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;
