"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Researcher, getUniqueValues, splitByDelimiters } from "../lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react"; // アイコン用

// フィルターモード型定義
type FilterMode = "AND" | "OR";

// FilterOptionタイプ（内部用）
interface FilterOption {
  field: string[];
  keyword: string[];
  keytechnology: string[];
  program: string[];
}

// フィルターモード（内部用）
interface FilterModes {
  field: FilterMode;
  keyword: FilterMode;
  keytechnology: FilterMode;
  program: FilterMode;
}

// プロパティの型定義 - 既存のAPIと互換性を維持
interface FilterPanelProps {
  researchers: Researcher[];
  onFilterChange: (filters: {
    field?: string;
    keyword?: string;
    keytechnology?: string;
    program?: string;
    theme?: string;
    affiliation?: string;
  }) => void;
}

export default function FilterPanel({ researchers, onFilterChange }: FilterPanelProps) {
  // 複数選択フィルター（内部状態）
  const [multiFilters, setMultiFilters] = useState<FilterOption>({
    field: [],
    keyword: [],
    keytechnology: [],
    program: []
  });
  
  // フィルターモード（AND/OR）
  const [filterModes, setFilterModes] = useState<FilterModes>({
    field: "OR",
    keyword: "OR",
    keytechnology: "OR",
    program: "OR"
  });
  
  // 開閉状態の管理
  const [openSections, setOpenSections] = useState({
    field: false,
    keyword: false,
    keytechnology: false,
    program: false
  });
  
  // テキスト検索（内部状態）
  const [searchText, setSearchText] = useState("");
  
  // 従来のAPIと互換性を持つフィルター状態（単一選択のみ）
  const [filters, setFilters] = useState({
    field: "",
    keyword: "",
    keytechnology: "",
    program: ""
  });

  // ユニークな値のリストを取得
  const fieldOptions = ["", ...getUniqueValues(researchers, "field")].filter(v => v.trim() !== "");
  const keywordOptions = ["", ...getUniqueValues(researchers, "keywords")].filter(v => v.trim() !== "");
  const technologyOptions = ["", ...getUniqueValues(researchers, "keytechnology")].filter(v => v.trim() !== "");
  const programOptions = ["", ...getUniqueValues(researchers, "program")].filter(v => v.trim() !== "");

  // フィルターのリセット
  const resetFilters = () => {
    setMultiFilters({
      field: [],
      keyword: [],
      keytechnology: [],
      program: []
    });
    setFilters({
      field: "",
      keyword: "",
      keytechnology: "",
      program: ""
    });
    setSearchText("");
    onFilterChange({});
  };

  // セクションの開閉を切り替える
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 内部フィルタリングを行い、結果を従来のAPI形式に変換して親に通知
  useEffect(() => {
    // 複数選択からAND/ORロジックで単一の文字列フィルターを生成
    const convertToLegacyFilter = () => {
      // マルチフィルターが選択されていない場合は空文字を返す
      // 選択されている場合は、AND/ORロジックに基づいてパイプで区切った文字列を返す
      const fieldValue = multiFilters.field.length > 0 
        ? (filterModes.field === "AND" ? `AND:${multiFilters.field.join("|")}` : multiFilters.field.join("|")) 
        : "";
      
      const keywordValue = multiFilters.keyword.length > 0 
        ? (filterModes.keyword === "AND" ? `AND:${multiFilters.keyword.join("|")}` : multiFilters.keyword.join("|")) 
        : "";
      
      const keytechnologyValue = multiFilters.keytechnology.length > 0 
        ? (filterModes.keytechnology === "AND" ? `AND:${multiFilters.keytechnology.join("|")}` : multiFilters.keytechnology.join("|")) 
        : "";
      
      const programValue = multiFilters.program.length > 0 
        ? (filterModes.program === "AND" ? `AND:${multiFilters.program.join("|")}` : multiFilters.program.join("|")) 
        : "";

      return {
        field: fieldValue,
        keyword: keywordValue,
        keytechnology: keytechnologyValue,
        program: programValue,
        // 検索テキストがある場合は、ここで検索対象としてthemeとaffiliationも追加
        ...(searchText ? { theme: searchText, affiliation: searchText } : {})
      };
    };

    // 従来のAPIとの互換性を維持するフィルター形式に変換
    const legacyFilters = convertToLegacyFilter();
    
    // フィルターをクリーンアップ (空の値を削除)
    const cleanFilters = Object.fromEntries(
      Object.entries(legacyFilters).filter(([_, v]) => v !== "")
    );
    
    // 親コンポーネントにフィルター変更を通知
    onFilterChange(cleanFilters);
  }, [multiFilters, filterModes, searchText, researchers]);

  // チェックボックスの変更ハンドラー関数
  const handleMultiFilterChange = (
    field: keyof FilterOption,
    option: string
  ) => {
    setMultiFilters(prev => {
      const current = [...prev[field]];
      
      if (current.includes(option)) {
        // 既に選択されている場合は削除
        return {
          ...prev,
          [field]: current.filter(item => item !== option)
        };
      } else {
        // 選択されていない場合は追加
        return {
          ...prev,
          [field]: [...current, option]
        };
      }
    });
  };

  // フィルターモードの変更ハンドラー関数
  const handleModeChange = (
    field: keyof FilterModes,
    mode: FilterMode
  ) => {
    setFilterModes(prev => ({
      ...prev,
      [field]: mode
    }));
  };

  // 選択項目数のバッジを表示
  const renderBadge = (count: number) => {
    if (count === 0) return null;
    return (
      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
        {count}
      </span>
    );
  };

  // アコーディオンヘッダー
  const renderAccordionHeader = (
    title: string, 
    filterKey: keyof FilterOption, 
    isOpen: boolean
  ) => (
    <div 
      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md cursor-pointer"
      onClick={() => toggleSection(filterKey)}
    >
      <div className="flex items-center">
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="ml-1 font-medium">{title}</span>
        {renderBadge(multiFilters[filterKey].length)}
      </div>
      
      <div className="flex space-x-2 text-xs">
        <label className="flex items-center">
          <input
            type="radio"
            name={`mode-${filterKey}`}
            checked={filterModes[filterKey] === "AND"}
            onChange={() => handleModeChange(filterKey, "AND")}
            className="mr-1"
            onClick={(e) => e.stopPropagation()}
          />
          AND
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={`mode-${filterKey}`}
            checked={filterModes[filterKey] === "OR"}
            onChange={() => handleModeChange(filterKey, "OR")}
            className="mr-1"
            onClick={(e) => e.stopPropagation()}
          />
          OR
        </label>
      </div>
    </div>
  );

  // フィルターセクションのレンダリング
  const renderFilterSection = (
    title: string,
    filterKey: keyof FilterOption,
    options: string[]
  ) => (
    <div className="mb-3">
      {renderAccordionHeader(title, filterKey, openSections[filterKey])}
      
      {openSections[filterKey] && (
        <div className="max-h-32 overflow-y-auto pl-2 space-y-1 text-sm mt-2 border rounded-md p-2">
          {options.map((option, index) => (
            option && (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${filterKey}-${index}`}
                  checked={multiFilters[filterKey].includes(option)}
                  onChange={() => handleMultiFilterChange(filterKey, option)}
                  className="mr-2"
                />
                <label htmlFor={`${filterKey}-${index}`} className="cursor-pointer truncate">
                  {option}
                </label>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );

  // 選択中のフィルター数を集計
  const totalSelectedFilters = Object.values(multiFilters).reduce(
    (sum, items) => sum + items.length, 
    0
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>フィルター</CardTitle>
          {totalSelectedFilters > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              リセット
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 検索テキストボックス */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="名前・テーマ・所属で検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 研究分野フィルター */}
          {renderFilterSection(
            "研究分野",
            "field",
            fieldOptions
          )}

          {/* キーワードフィルター */}
          {renderFilterSection(
            "キーワード",
            "keyword",
            keywordOptions
          )}

          {/* 技術フィルター */}
          {renderFilterSection(
            "キーテクノロジー",
            "keytechnology",
            technologyOptions
          )}

          {/* プログラムフィルター */}
          {renderFilterSection(
            "化血研事業",
            "program",
            programOptions
          )}

          {/* 選択中のフィルター情報 - 折りたたまれている時に参照できるよう表示 */}
          {totalSelectedFilters > 0 && (
            <div className="mt-4 pt-3 border-t text-xs text-gray-600">
              <div>選択中のフィルター: {totalSelectedFilters}項目</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}