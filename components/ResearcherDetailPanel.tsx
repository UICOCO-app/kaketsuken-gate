"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { Researcher, splitByDelimiters } from "../lib/utils";

// プロパティの型定義
interface ResearcherDetailPanelProps {
  researcher: Researcher | null;
  relatedResearchers: Researcher[];
  onSelectResearcher: (id: string) => void;
  onClose?: () => void; // 閉じるボタン用（オプション）
}

export default function ResearcherDetailPanel({
  researcher,
  relatedResearchers,
  onSelectResearcher,
  onClose,
}: ResearcherDetailPanelProps) {
  // パネルコンテンツへの参照を作成
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 選択された研究者が変わったら上部にスクロールする
  useEffect(() => {
    if (panelRef.current && researcher) {
      panelRef.current.scrollTop = 0;
    }
  }, [researcher?.id]); // 研究者IDが変わった時だけ実行

  // 研究者が選択されていない場合のメッセージ
  if (!researcher) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>研究者詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">研究者を選択してください</p>
        </CardContent>
      </Card>
    );
  }

  // 各種データを分割して配列化
  const fields = splitByDelimiters(researcher.field);
  const keywords = splitByDelimiters(researcher.keywords);
  const keytechnology = splitByDelimiters(researcher.keytechnology);
  const programs = splitByDelimiters(researcher.program);

  // カラーコードのマッピング
  const colorMap = {
    "研究分野": "bg-purple-100 text-purple-800",
    "プログラム": "bg-yellow-100 text-yellow-800",
    "テーマ": "bg-red-100 text-red-800",
    "キーワード": "bg-blue-100 text-blue-800",
    "キー技術": "bg-green-100 text-green-800"
  };

  // 関連研究者をクリックした時のハンドラー
  const handleRelatedResearcherClick = (id: string) => {
    onSelectResearcher(id);
    // スクロールはuseEffectで処理されるため、ここでは特に何もしない
  };

  return (
    <Card className="w-full h-full overflow-hidden">
      <CardHeader className="pb-2 sticky top-0 bg-white z-10 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{researcher.name}</CardTitle>
            <p className="text-sm text-gray-500">{researcher.affiliation}</p>
          </div>
          {onClose && (
            <Button
              variant="outline" // ここを変更
              size="icon"
              className="ml-auto"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent 
        className="overflow-y-auto p-4 max-h-[calc(100%-80px)]"
        ref={panelRef} // スクロール制御のための参照を追加
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左側カラム: 研究者の基本情報 */}
          <div className="space-y-4">
            {/* テーマ */}
            {researcher.theme && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">研究テーマ</h3>
                <p className="text-sm p-2 bg-gray-50 rounded-md border">{researcher.theme}</p>
              </div>
            )}

            {/* 研究分野 */}
            {fields.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">研究分野</h3>
                <div className="flex flex-wrap gap-1">
                  {fields.map((field, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs ${colorMap["研究分野"]}`}
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* キーワード */}
            {keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">キーワード</h3>
                <div className="flex flex-wrap gap-1">
                  {keywords.map((keyword, index) => (
                    keyword && (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${colorMap["キーワード"]}`}
                      >
                        {keyword}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* キーテクノロジー */}
            {keytechnology.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">キーテクノロジー</h3>
                <div className="flex flex-wrap gap-1">
                  {keytechnology.map((tech, index) => (
                    tech && (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${colorMap["キー技術"]}`}
                      >
                        {tech}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* プログラム */}
            {programs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">化血研事業</h3>
                <div className="flex flex-wrap gap-1">
                  {programs.map((program, index) => (
                    program && (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${colorMap["プログラム"]}`}
                      >
                        {program}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右側カラム: 関連研究者 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">関連研究者</h3>
            {relatedResearchers.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {relatedResearchers.map((related) => {
                  // 関連度スコアを取得
                  const connection = researcher.connections?.find(
                    (c) => c.id === related.id
                  );
                  const score = connection?.score || 0;
                  
                  // 関連研究者の分野を取得
                  const relatedFields = splitByDelimiters(related.field);

                  return (
                    <div
                      key={related.id}
                      className="border rounded-md p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRelatedResearcherClick(related.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <div className="font-medium text-sm">{related.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">
                            {related.affiliation}
                          </div>
                        </div>
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          関連度: {score}
                        </span>
                      </div>
                      {/* 分野タグ（最大2つまで表示） */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {relatedFields.slice(0, 2).map((field, i) => (
                          <span 
                            key={i} 
                            className="inline-block bg-purple-50 text-purple-700 text-xs px-1.5 py-0.5 rounded"
                          >
                            {field}
                          </span>
                        ))}
                        {relatedFields.length > 2 && (
                          <span className="text-xs text-gray-500">+{relatedFields.length - 2}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                関連研究者はいません
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}