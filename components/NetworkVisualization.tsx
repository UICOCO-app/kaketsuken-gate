"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Researcher, splitByDelimiters, fieldColors } from "../lib/utils";

// プロパティの型定義
interface NetworkVisualizationProps {
  researchers: Researcher[];
  selectedResearcherId: string | null;
  onSelectResearcher: (id: string) => void;
}

export default function NetworkVisualization({
  researchers,
  selectedResearcherId,
  onSelectResearcher,
}: NetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 情報表示用
  const researcherCount = researchers.length;
  const connectionCount = researchers.reduce((count, researcher) => {
    return count + (researcher.connections?.filter(c => c.score >= 2).length || 0);
  }, 0) / 2; // 双方向でカウントされるので2で割る

  // D3.jsを使用してネットワーク図を描画
  useEffect(() => {
    if (!svgRef.current || researchers.length === 0) return;

    // コンテナサイズの取得と調整
    const container = containerRef.current;
    if (!container) return;
    
    // SVG要素のサイズ取得
    const svg = d3.select(svgRef.current);
    const width = container.clientWidth;
    const height = container.clientHeight || 500; // 高さが設定されていない場合は500pxをデフォルトに

    // 以前の描画をクリア
    svg.selectAll("*").remove();

    // ノード（研究者）のデータ準備
    const nodes = researchers.map(r => ({ ...r }));
    
    // 現在表示されている研究者のIDセットを作成
    const visibleResearcherIds = new Set(nodes.map(n => n.id));
    
    // 関連度が一定以上のリンクを抽出（フィルター適用で除外されたノードへのリンクも除外）
    const links: Array<{ source: string; target: string; value: number }> = [];
    
    researchers.forEach(researcher => {
      if (researcher.connections && visibleResearcherIds.has(researcher.id)) {
        researcher.connections.forEach(connection => {
          // 関連度スコアが2以上のみリンクとして表示
          // かつ、リンク先の研究者がフィルターで除外されていないことを確認
          if (connection.score >= 2 && visibleResearcherIds.has(connection.id)) {
            links.push({
              source: researcher.id,
              target: connection.id,
              value: connection.score,
            });
          }
        });
      }
    });

    // シミュレーションの設定 - 中心点を上に移動して調整
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => 120 / (Math.sqrt(d.value) || 1)) // 関連度が高いほど近く配置（調整）、距離も縮小
      )
      .force("charge", d3.forceManyBody().strength(-200)) // 反発力を適度に調整
      .force("center", d3.forceCenter(width / 2, (height / 2) - 30)) // 中心点を上に移動
      .force("collision", d3.forceCollide().radius(25).strength(0.8)) // 衝突半径も縮小
      .force("x", d3.forceX(width / 2).strength(0.05)) // X方向の力
      .force("y", d3.forceY((height / 2) - 30).strength(0.05)); // Y方向の力も上に移動

    // SVGフィルター定義（影効果用）
    const defs = svg.append("defs");
    
    // 影の定義
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
    
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 2)
      .attr("result", "blur");
    
    filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 1)
      .attr("dy", 1)
      .attr("result", "offsetBlur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // SVGグラデーション定義（複数分野用）
    const gradientDefs = defs.append("defs");
    
    // 複数分野を持つ研究者のノードにグラデーションを適用するためのIDを生成
    nodes.forEach((researcher) => {
      const fields = splitByDelimiters(researcher.field);
      
      // 複数分野を持つ場合のみグラデーションを定義
      if (fields.length > 1) {
        // グラデーションID
        const gradientId = `gradient-${researcher.id}`;
        
        // 線形グラデーション定義
        const gradient = gradientDefs.append("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%");
        
        // 各分野の色を均等に配置
        fields.forEach((field, index) => {
          const color = fieldColors[field] || fieldColors["その他"];
          const offset = `${(index * 100) / (fields.length - 1)}%`;
          
          gradient.append("stop")
            .attr("offset", offset)
            .attr("stop-color", color);
        });
      }
    });

    // 背景をクリックするとリセットするための透明な四角形
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", () => {
        // 選択解除して親コンポーネントに通知
        if (selectedResearcherId) {
          onSelectResearcher("");
        }
      });

    // リンクの描画（関連度によって線の太さと色を調整）
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", d => {
        // 関連度によって色を変える
        const value = d.value as number;
        if (value >= 6) return "#1976D2"; // 高関連度：濃い青
        if (value >= 4) return "#64B5F6"; // 中関連度：中間の青
        return "#BBDEFB"; // 低関連度：薄い青
      })
      .attr("stroke-opacity", d => {
        // 関連度によって不透明度を変える
        const value = d.value as number;
        if (value >= 6) return 0.8;
        if (value >= 4) return 0.6;
        return 0.4;
      })
      .attr("stroke-width", d => Math.max(0.8, Math.sqrt(d.value) * 0.8)); // 線の太さも縮小

    // ノードのグループ作成
    const node = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("click", (event, d) => {
        event.stopPropagation(); // 背景へのイベント伝播を防止
        onSelectResearcher(d.id);
      });

    // 常に表示される情報パネル
    const infoPanel = svg.append("g")
      .attr("transform", `translate(${width - 220}, 20)`)
      .attr("opacity", 0);

    // 情報パネルの背景（高さは動的に調整）
    const panelBg = infoPanel.append("rect")
      .attr("width", 210)
      .attr("height", 70) // 初期高さ（後で調整）
      .attr("fill", "white")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("filter", "url(#drop-shadow)");

    // 研究者名テキスト
    const nameText = infoPanel.append("text")
      .attr("x", 10)
      .attr("y", 25)
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .attr("fill", "#333");

    // 所属テキスト（複数行の場合があるためグループとして処理）
    const affiliationGroup = infoPanel.append("g")
      .attr("transform", "translate(10, 45)");

    // ドラッグ処理
    node.call(d3.drag<any, any>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended) as any
    );

    // マウスイベントの設定
    node
      .on("mouseover", (event, d) => {
        // 研究者名を更新
        nameText.text(d.name || '名前なし');
        
        // 所属テキストを更新（長いテキストは折り返し）
        updateAffiliation(affiliationGroup, d.affiliation || '-');
        
        infoPanel.transition()
          .duration(100)
          .attr("opacity", 1);
      })
      .on("mouseout", () => {
        infoPanel.transition()
          .duration(200)
          .attr("opacity", 0);
      });

    // 所属テキストを折り返して表示する関数
    function updateAffiliation(group, text) {
      // 既存のテキスト要素をクリア
      group.selectAll("*").remove();
      
      const maxWidth = 190; // テキストの最大幅
      const lineHeight = 18; // 行の高さ
      const maxLines = 2;    // 最大行数
      
      // テキストを単語で分割
      let words = text.split('');
      let lines = [];
      let currentLine = "";
      
      // 一時的なテキスト要素でテキスト幅を測定
      const tempText = group.append("text")
        .attr("font-size", "12px")
        .style("visibility", "hidden");
      
      // テキストを折り返す
      for (let i = 0; i < words.length; i++) {
        const char = words[i];
        const testLine = currentLine + char;
        
        tempText.text(testLine);
        const testWidth = tempText.node().getComputedTextLength();
        
        if (testWidth > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = char;
          
          // 最大行数に達した場合
          if (lines.length >= maxLines - 1) {
            // 残りの文字が最大幅に収まるか確認
            const remainingText = words.slice(i).join('');
            tempText.text(remainingText);
            const remainingWidth = tempText.node().getComputedTextLength();
            
            if (remainingWidth > maxWidth) {
              // 最後の行を省略して「...」を追加
              currentLine += words.slice(i, i + Math.min(10, words.length - i)).join('');
              currentLine += "...";
              lines.push(currentLine);
              break;
            }
          }
        } else {
          currentLine = testLine;
        }
      }
      
      // 最終行を追加
      if (currentLine !== "" && lines.length < maxLines) {
        lines.push(currentLine);
      }
      
      // 一時テキスト要素を削除
      tempText.remove();
      
      // テキスト行を描画
      lines.forEach((line, i) => {
        group.append("text")
          .attr("y", i * lineHeight)
          .attr("font-size", "12px")
          .attr("fill", "#666")
          .text(line);
      });
      
      // 情報パネルの高さを調整
      const panelHeight = 45 + (lines.length * lineHeight);
      panelBg.attr("height", panelHeight);
    }

    // ノードの円を描画（半径を小さくする）
    node.append("circle")
      .attr("r", 11) // 元の半径22から半分の11に変更
      .attr("fill", d => {
        const fields = splitByDelimiters(d.field);
        
        // 複数分野を持つ場合はグラデーション、単一分野の場合は単色
        if (fields.length > 1) {
          return `url(#gradient-${d.id})`;
        } else {
          return fieldColors[fields[0]] || fieldColors["その他"];
        }
      })
      .attr("stroke", d => d.id === selectedResearcherId ? "#FF5722" : "#fff") // 選択されたノードはオレンジ色の枠
      .attr("stroke-width", d => d.id === selectedResearcherId ? 2 : 1) // ストロークの幅も縮小
      .attr("filter", "url(#drop-shadow)");

    // ノードのテキスト背景の位置とサイズを調整
    node.append("rect")
      .attr("x", -30) // -40から-30に調整
      .attr("y", 12) // 18から12に調整
      .attr("width", 60) // 80から60に調整
      .attr("height", 14) // 16から14に調整
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .attr("rx", 3)
      .attr("ry", 3);

    // ノードのテキスト位置調整
    node.append("text")
      .attr("dy", 23) // 30から23に調整
      .attr("text-anchor", "middle")
      .text(d => d.name || "名前なし")
      .attr("font-size", "10px") // 12pxから10pxに縮小
      .attr("fill", "#333")
      .attr("font-weight", "bold");

    // 詳細ボタン（iアイコン）の位置とサイズを調整
    node.append("circle")
      .attr("class", "detail-button")
      .attr("r", 6) // 8から6に縮小
      .attr("cx", 9) // 18から9に調整
      .attr("cy", -8) // -15から-8に調整
      .attr("fill", "#FFFFFF")
      .attr("stroke", "#1976D2")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation(); // 親要素のクリックイベントを防止
        onSelectResearcher(d.id);
      });
      
    // 詳細ボタンのアイコン位置調整
    node.append("text")
      .attr("class", "detail-icon")
      .attr("x", 9) // 18から9に調整
      .attr("y", -8) // -15から-8に調整
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-family", "sans-serif")
      .attr("font-size", "8px") // 10pxから8pxに縮小
      .attr("fill", "#1976D2")
      .attr("pointer-events", "none")
      .text("i");

    // シミュレーションの更新関数（ノードが画面外に出ないように制限）
    simulation.on("tick", () => {
      // リンクの位置更新 - 下部に大きな余白を追加
      link
        .attr("x1", d => Math.max(20, Math.min(width - 20, (d as any).source.x)))
        .attr("y1", d => Math.max(20, Math.min(height - 70, (d as any).source.y))) // 下部に70px余白を確保
        .attr("x2", d => Math.max(20, Math.min(width - 20, (d as any).target.x)))
        .attr("y2", d => Math.max(20, Math.min(height - 70, (d as any).target.y))); // 下部に70px余白を確保

      // ノードの位置更新 - 下部に大きな余白を追加
      node
        .attr("transform", d => {
          // 端から離れるようにする
          const padding = 30;
          const bottomPadding = 70; // 下部の余白を70pxに増やす
          const x = Math.max(padding, Math.min(width - padding, (d as any).x));
          const y = Math.max(padding, Math.min(height - bottomPadding, (d as any).y));
          
          return `translate(${x},${y})`;
        });
    });
    
    // 初期配置の最適化（オプション）
    // 最初の数フレームを高速で実行して、配置を良くする
    for (let i = 0; i < 20; ++i) simulation.tick();

    // 選択中のノードをハイライト表示
    if (selectedResearcherId) {
      // 関連するノードを検索
      const selectedNode = researchers.find(r => r.id === selectedResearcherId);
      
      // フィルター後のノードセットを使用して、表示されている関連ノードのIDのみを取得
      const relatedIds = selectedNode?.connections
        ?.filter(c => c.score >= 2 && visibleResearcherIds.has(c.id))
        ?.map(c => c.id) || [];

      // 選択されていないノードを薄く表示
      node.filter(d => d.id !== selectedResearcherId && !relatedIds.includes(d.id))
        .transition()
        .duration(300)
        .attr("opacity", 0.3);

      // 選択されたノードを強調（サイズ調整）
      node.filter(d => d.id === selectedResearcherId)
        .select("circle")
        .transition()
        .duration(300)
        .attr("r", 13) // 26から13に縮小
        .attr("stroke-width", 2); // 3から2に縮小

      // 選択されていないリンクを薄く表示
      link.filter(d => 
        (d as any).source.id !== selectedResearcherId && 
        (d as any).target.id !== selectedResearcherId
      )
        .transition()
        .duration(300)
        .attr("opacity", 0.2);
    } else {
      // 全ノードを通常表示に戻す
      node.transition()
        .duration(300)
        .attr("opacity", 1)
        .select("circle")
        .attr("r", 11) // 22から11に縮小
        .attr("stroke-width", d => d.id === selectedResearcherId ? 2 : 1); // ストロークの幅も縮小

      // 全リンクを通常表示に戻す
      link.transition()
        .duration(300)
        .attr("opacity", 0.6);
    }

    // ドラッグ開始時の関数
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // ドラッグ中の関数
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    // ドラッグ終了時の関数
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // コンポーネントのクリーンアップ時にシミュレーションを停止
    return () => {
      simulation.stop();
    };
  }, [researchers, selectedResearcherId, onSelectResearcher]);

  return (
    <div className="w-full flex flex-col">
      {/* ネットワーク図コンテナ - 高さを固定 */}
      <div className="w-full border rounded-t-md bg-gray-50 relative" ref={containerRef} style={{ height: "480px" }}>
        <div className="absolute top-2 left-2 text-sm font-medium text-gray-500">
          研究者数: {researcherCount} | 接続数: {Math.round(connectionCount)}
        </div>
        
        {/* SVG要素 - 説明テキスト用のスペースなし */}
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      {/* 説明テキストを別コンテナに配置 */}
      <div className="w-full text-center bg-gray-100 py-2 text-xs text-gray-600 border-t-0 border-x border-b border-gray-200 rounded-b-md">
        ※ ノードをクリックで研究者を選択、背景をクリックでリセット、ドラッグで移動できます
      </div>
    </div>
  );
}