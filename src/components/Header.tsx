'use client';

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSort, faSyncAlt } from "@fortawesome/free-solid-svg-icons";




const Header = () => {
    const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [languages, setLanguages] = useState([])

  const fetchLanguages = async () => {
    try {
        const res = await fetch(`/api/servers/languages`);
        const data = await res.json();
        setLanguages(data);
        setLoading(false)
    } catch (error) {
        console.error("Failed to fetch servers:", error);
    } 
  };
    
  useEffect(() => {
    fetchLanguages();
  }, []);

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md flex flex-col sm:flex-row items-center justify-between">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold">FiveM Tracker</h1>
        <p className="text-gray-400">Unlock the power of FiveM</p>
      </div>

      <div className="mt-4 sm:mt-0 w-full sm:w-3/5 flex gap-2">
        <input
          type="text"
          placeholder="Search servers..."
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="mt-4 sm:mt-0 flex gap-2">
        {/* Filter Button */}
        <div className="relative">
          <button
            className="p-2 bg-gray-800 rounded hover:bg-orange-500 transition"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FontAwesomeIcon icon={faFilter} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-gray-800 border border-gray-700 p-2 rounded shadow-lg">
              <input
                type="text"
                placeholder="Search country..."
                className="w-full p-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="mt-2 max-h-40 overflow-y-auto">
                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : (
                    languages.map((language) => (
                        <div key={language} className="p-1 rounded bg-gray-700 text-white border border-gray-600 mt-1">{language}</div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort Button */}
        <button className="p-2 bg-gray-800 rounded hover:bg-orange-500 transition">
          <FontAwesomeIcon icon={faSort} />
        </button>

        {/* Reset Filters Button */}
        <button className="p-2 bg-gray-800 rounded hover:bg-orange-500 transition">
          <FontAwesomeIcon icon={faSyncAlt} />
        </button>
      </div>
    </header>
  );
};

export default Header;
