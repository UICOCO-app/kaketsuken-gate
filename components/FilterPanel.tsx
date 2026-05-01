"use client";

import React, { useState } from "react";
import { Researcher, FilterState, getUniqueValues, extractAllEvents } from "../lib/utils";

interface FilterPanelProps {
  researchers: Researcher[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  mode: "AND" | "OR";
  onSelectionChange: (selected: string[]) => void;
  onModeChange: (mode: "AND" | "OR") => void;
}

function FilterSection({
  title,
  options,
  selected,
  mode,
  onSelectionChange,
  onModeChange,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((s) => s !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  return (
    <div className="mb-2 border rounded-md overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-sm">
          {title}
          {selected.length > 0 && (
            <span className="ml-1 text-blue-600">({selected.length})</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <label className="flex items-center gap-0.5 cursor-pointer">
              <input
                type="radio"
                checked={mode === "AND"}
                onChange={() => onModeChange("AND")}
                onClick={(e) => e.stopPropagation()}
                className="w-3 h-3"
              />
              AND
            </label>
            <label className="flex items-center gap-0.5 cursor-pointer">
              <input
                type="radio"
                checked={mode === "OR"}
                onChange={() => onModeChange("OR")}
                onClick={(e) => e.stopPropagation()}
                className="w-3 h-3"
              />
              OR
            </label>
          </div>
          <span>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="p-2 max-h-40 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="w-3 h-3"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({
  researchers,
  filters,
  onFilterChange,
}: FilterPanelProps) {
  const allEvents = extractAllEvents(researchers);

  const updateFilter = (key: keyof FilterState, value: unknown) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="p-3 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3">フィルター</h2>

      <input
        type="text"
        placeholder="名前・テーマ・所属で検索..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="w-full p-2 mb-3 border rounded-md text-sm"
      />

      {allEvents.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">イベント参加</label>
          <select
            value={filters.selectedEvent}
            onChange={(e) => updateFilter("selectedEvent", e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="">すべて表示</option>
            {allEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        </div>
      )}

      <FilterSection
        title="研究分野"
        options={getUniqueValues(researchers, "field")}
        selected={filters.fields}
        mode={filters.fieldMode}
        onSelectionChange={(v) => updateFilter("fields", v)}
        onModeChange={(v) => updateFilter("fieldMode", v)}
      />

      <FilterSection
        title="キーワード"
        options={getUniqueValues(researchers, "keywords")}
        selected={filters.keywords}
        mode={filters.keywordMode}
        onSelectionChange={(v) => updateFilter("keywords", v)}
        onModeChange={(v) => updateFilter("keywordMode", v)}
      />

      <FilterSection
        title="キーテクノロジー"
        options={getUniqueValues(researchers, "keytechnology")}
        selected={filters.keytechnologies}
        mode={filters.keytechnologyMode}
        onSelectionChange={(v) => updateFilter("keytechnologies", v)}
        onModeChange={(v) => updateFilter("keytechnologyMode", v)}
      />

      <FilterSection
        title="化血研事業"
        options={getUniqueValues(researchers, "program")}
        selected={filters.programs}
        mode={filters.programMode}
        onSelectionChange={(v) => updateFilter("programs", v)}
        onModeChange={(v) => updateFilter("programMode", v)}
      />
    </div>
  );
}