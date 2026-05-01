"use client";

import React, { useState, useEffect } from "react";
import NetworkVisualization from "@/components/NetworkVisualization";
import FilterPanel from "@/components/FilterPanel";
import ResearcherDetailPanel from "@/components/ResearcherDetailPanel";
import { loadResearchersData, filterResearchers, Researcher, FilterState } from "@/lib/utils";

const defaultFilters: FilterState = {
  search: "",
  fields: [],
  fieldMode: "OR",
  keywords: [],
  keywordMode: "OR",
  keytechnologies: [],
  keytechnologyMode: "OR",
  programs: [],
  programMode: "OR",
  selectedEvent: "",
};

export default function Home() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [filteredResearchers, setFilteredResearchers] = useState<Researcher[]>([]);
  const [selectedResearcherId, setSelectedResearcherId] = useState<string | null>(null);
  const [relatedResearchers, setRelatedResearchers] = useState<Researcher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const data = await loadResearchersData();
        setResearchers(data);
        setFilteredResearchers(data);
      } catch (error) {
        console.error("Failed to load researcher data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectResearcher = (id: string) => {
    setSelectedResearcherId(id);
    const selectedResearcher = filteredResearchers.find(r => r.id === id);
    if (!selectedResearcher || !selectedResearcher.connections) {
      setRelatedResearchers([]);
      return;
    }
    const relatedIds = selectedResearcher.connections
      .sort((a, b) => b.score - a.score)
      .map(c => c.id);
    const related = relatedIds
      .map(id => filteredResearchers.find(r => r.id === id))
      .filter((r): r is Researcher => r !== undefined);
    setRelatedResearchers(related);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const filtered = filterResearchers(researchers, newFilters);
    setFilteredResearchers(filtered);
    if (selectedResearcherId && !filtered.some(r => r.id === selectedResearcherId)) {
      setSelectedResearcherId(null);
      setRelatedResearchers([]);
    }
  };

  const selectedResearcher = selectedResearcherId
    ? filteredResearchers.find(r => r.id === selectedResearcherId) || null
    : null;

  const hasNoResults = filteredResearchers.length === 0;

  return (
    <main className="min-h-screen p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">KaketsukenGate</h1>
        <p className="text-center mb-8">研究者ネットワーク可視化アプリ</p>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <FilterPanel
                researchers={researchers}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="md:col-span-3 space-y-4">
              <div className="h-[500px]">
                {hasNoResults ? (
                  <div className="w-full border rounded-md bg-gray-50 flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <p className="text-xl font-medium text-gray-500 mb-2">該当する研究者がいません</p>
                      <p className="text-sm text-gray-400">フィルター条件を変更してください</p>
                    </div>
                  </div>
                ) : (
                  <NetworkVisualization
                    researchers={filteredResearchers}
                    selectedResearcherId={selectedResearcherId}
                    onSelectResearcher={handleSelectResearcher}
                  />
                )}
              </div>
              <div className="h-[400px]">
                <ResearcherDetailPanel
                  researcher={selectedResearcher}
                  relatedResearchers={relatedResearchers}
                  onSelectResearcher={handleSelectResearcher}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}