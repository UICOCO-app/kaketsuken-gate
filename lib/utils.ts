import Papa from "papaparse";

// 研究者データの型定義（新しいデータ構造に対応）
export interface Researcher {
  id: string;
  name: string;
  affiliation: string;   // 新規追加
  program: string;       // 元々の複数形(programs)から単数形に変更
  theme: string;         // 新規追加
  field: string;
  keywords: string;
  keytechnology: string; // technologies から変更
  // 計算された関連研究者とその関連スコア
  connections?: Array<{ id: string; score: number }>;
}

// 分野ごとの色の定義（拡張版）
export const fieldColors: { [key: string]: string } = {
  "造血器腫瘍学・造血幹細胞・造血発生関連": "#FF9999", // ピンク
  "免疫学関連": "#FFCC99", // オレンジ
  "ウイルス学関連": "#D0F0C0", // 明るい緑
  "細菌学(含真菌学)・寄生虫学関連": "#98D8BF", // 青緑
  "血栓止血学・血管生物学関連": "#B0C4DE", // 薄い青
  "複数分野所属": "#E6E6FA", // ラベンダー
  // 他の分野が追加された場合の予備色
  "医化学関連": "#FFD700", // ゴールド
  "分子レベルから細胞レベルの生物学関連": "#7FD1B9", // ティール
  "腫瘍生物学関連": "#FF6B6B", // 赤
  "神経内科学関連": "#B76BFF", // 紫
  "その他": "#A0AEC0", // グレー
};

// カラーコードのテキスト色を判定する関数（明るさに基づいてテキスト色を黒か白に設定）
export function getTextColor(hexColor: string): string {
  // '#FF9999' 形式を数値に変換
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 明度計算: (0.299*R + 0.587*G + 0.114*B)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
  
  // 明度が128以上（明るい色）には暗いテキスト、それ以外には明るいテキスト
  return brightness > 128 ? '#333333' : '#FFFFFF';
}

// 複数の区切り文字で文字列を分割する関数
export function splitByDelimiters(str: string): string[] {
  if (!str) return [];
  // カンマ（,）、カンマとスペース（, ）、全角カンマ（、）で分割
  return str.split(/,\s*|、/).filter(item => item.trim() !== '');
}

// CSVからデータを読み込む関数
export async function loadResearchersData(): Promise<Researcher[]> {
  try {
    // CSVファイルの取得
    const response = await fetch("/data/researchers.csv");
    const csvText = await response.text();
    
    console.log("CSV text:", csvText.substring(0, 200) + "..."); // 最初の200文字だけ表示
    
    // CSVのパース
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: ",",  // カンマ区切り
    });
    
    console.log("Parsed data:", data); // パースされたデータを表示
    console.log("First researcher:", data[0]); // 最初の研究者データを表示
    
    // 研究者間の関連性を計算
    const researchers = data as Researcher[];
    calculateConnections(researchers);
    
    return researchers;
  } catch (error) {
    console.error("データの読み込み中にエラーが発生しました:", error);
    return [];
  }
}

// 研究者間の関連性を計算する関数
export function calculateConnections(researchers: Researcher[]): void {
  researchers.forEach(researcher => {
    // 複数の区切り文字に対応した分割
    const keywords = splitByDelimiters(researcher.keywords);
    const keytechnology = splitByDelimiters(researcher.keytechnology);
    const fields = splitByDelimiters(researcher.field);
    const themes = splitByDelimiters(researcher.theme);
    // プログラムの分割はまだ行うが、関連度計算には使用しない
    const programs = splitByDelimiters(researcher.program);
    
    // 関連度スコアを計算して格納する配列
    const connections: Array<{ id: string; score: number }> = [];
    
    researchers.forEach(otherResearcher => {
      // 自分自身は関連度計算から除外
      if (researcher.id === otherResearcher.id) return;
      
      // 複数の区切り文字に対応した分割
      const otherKeywords = splitByDelimiters(otherResearcher.keywords);
      const otherKeytechnology = splitByDelimiters(otherResearcher.keytechnology);
      const otherFields = splitByDelimiters(otherResearcher.field);
      const otherThemes = splitByDelimiters(otherResearcher.theme);
      // プログラムの分割はまだ行うが、関連度計算には使用しない
      const otherPrograms = splitByDelimiters(otherResearcher.program);
      
      // スコア計算
      let score = 0;
      
      // 分野の一致を確認（各+3点）
      fields.forEach(field => {
        if (field && otherFields.includes(field)) {
          score += 3;
        }
      });
      
      // テーマの一致を確認（各+2点）
      themes.forEach(theme => {
        if (theme && otherThemes.includes(theme)) {
          score += 2;
        }
      });
      
      // プログラムの一致を確認する部分を削除
      // プログラム（化血研事業）の一致はスコア計算から除外
      
      // キーワードの一致数（各+1点）
      keywords.forEach(keyword => {
        if (keyword && otherKeywords.includes(keyword)) {
          score += 1;
        }
      });
      
      // 技術の一致数（各+1点）
      keytechnology.forEach(tech => {
        if (tech && otherKeytechnology.includes(tech)) {
          score += 1;
        }
      });
      
      // スコアが0より大きい場合のみ関連研究者として追加
      if (score > 0) {
        connections.push({ id: otherResearcher.id, score });
      }
    });
    
    // スコア順にソート（降順）
    connections.sort((a, b) => b.score - a.score);
    researcher.connections = connections;
  });
}

// 拡張されたフィルタリング関数 - AND/OR検索に対応
export function filterResearchers(
  researchers: Researcher[],
  filters: {
    field?: string;
    keyword?: string;
    keytechnology?: string;
    program?: string;
    theme?: string;
    affiliation?: string;
  }
): Researcher[] {
  // フィルターが空の場合は全データを返す
  if (Object.keys(filters).length === 0) {
    return researchers;
  }

  return researchers.filter(researcher => {
    // テキスト検索（名前、テーマ、所属）
    if (filters.theme || filters.affiliation) {
      const searchText = filters.theme || filters.affiliation || "";
      const textMatch =
        (researcher.name && researcher.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (researcher.theme && researcher.theme.toLowerCase().includes(searchText.toLowerCase())) ||
        (researcher.affiliation && researcher.affiliation.toLowerCase().includes(searchText.toLowerCase()));
      
      if (!textMatch) return false;
    }

    // 分野でフィルタリング - AND/OR検索対応
    if (filters.field && !matchField(researcher.field, filters.field)) {
      return false;
    }
    
    // キーワードでフィルタリング - AND/OR検索対応
    if (filters.keyword && !matchField(researcher.keywords, filters.keyword)) {
      return false;
    }
    
    // 技術でフィルタリング - AND/OR検索対応
    if (filters.keytechnology && !matchField(researcher.keytechnology, filters.keytechnology)) {
      return false;
    }
    
    // プログラムでフィルタリング - AND/OR検索対応
    if (filters.program && !matchField(researcher.program, filters.program)) {
      return false;
    }
    
    return true;
  });
}

/**
 * フィールド値がフィルター条件と一致するかチェックする関数
 * AND/OR検索に対応
 * @param fieldValue フィールド値（カンマ区切りの文字列）
 * @param filterValue フィルター条件（パイプ区切りの文字列、または AND: プレフィックス付き）
 * @returns 一致する場合はtrue、しない場合はfalse
 */
function matchField(fieldValue: string | undefined, filterValue: string | undefined): boolean {
  if (!filterValue || !fieldValue) return !filterValue;
  
  // フィールド値をカンマで分割
  const fieldValues = splitByDelimiters(fieldValue);
  
  // AND検索の場合
  if (filterValue.startsWith("AND:")) {
    const filterValues = filterValue.substring(4).split("|");
    // すべての条件に一致する必要がある
    return filterValues.every(value => fieldValues.includes(value));
  } 
  // OR検索の場合
  else {
    const filterValues = filterValue.split("|");
    // いずれかの条件に一致すればよい
    return filterValues.some(value => fieldValues.includes(value));
  }
}

// 一意な値のリストを取得する関数
export function getUniqueValues(researchers: Researcher[], field: keyof Researcher): string[] {
  const values = new Set<string>();
  
  researchers.forEach(researcher => {
    if (typeof researcher[field] === 'string') {
      // 複数の区切り文字に対応した分割（すべてのフィールドタイプに対応）
      if (['keywords', 'keytechnology', 'field', 'program', 'theme'].includes(field)) {
        const items = splitByDelimiters(researcher[field] as string);
        items.forEach(item => {
          if (item) values.add(item.trim());
        });
      } else {
        // 単一値のフィールド
        if (researcher[field]) values.add((researcher[field] as string).trim());
      }
    }
  });
  
  return Array.from(values).sort();
}