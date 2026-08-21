export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface AffectedSector {
  sector: string;
  direction: "up" | "down";
  reason: string;
}

export interface RelatedNewsItem {
  title: string;
  snippet: string;
  source: string;
  url: string;
  date: string;
}

export interface VerifiedFact {
  fact: string; // 입력 원문에서 직접 확인되는 사실
  quote: string; // 원문 근거 문장
}

export interface AIInterpretation {
  topic: string; // 해석 주제/관점
  sentiment: "bullish" | "bearish" | "neutral"; // 방향성
  interpretation: string; // "~로 해석될 수 있음" 형태의 가설/가능성 표현
}

export interface AnalysisResult {
  title: string;
  summary3Sec: string;
  
  // Policy/Deposit/Non-stock document flag
  isPolicyDoc?: boolean;

  // 1. 확인된 사실 (원문 직접 근거)
  verifiedFacts: VerifiedFact[];

  // 2. AI 해석 (호재/악재/중립 판단 및 해석 가능성)
  aiInterpretations: AIInterpretation[];
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentReason: string;
  impactScore: number; // 1 to 5 (참고용 기준)

  // 3. 추가 확인 필요 (원문 미확인, 공시/공식발표/타기사 필요)
  needFurtherVerification: string[];

  // 4. 리스크 (오해 여지, 누락 정보, 과장 가능성, 반대 해석)
  riskFactors: string[];

  // 보조 섹션 (용어, 연관 업종, 참고 자료 등)
  glossary: GlossaryItem[];
  affectedSectors: AffectedSector[];
  keyTakeaways?: string[];
  actionPlan?: string[];
  riskFactor?: string;
  sourceCredibility: string; // 추가 확인에 참고할 수 있는 자료 및 출처 정보
  authoritativeContext: string[]; // 추가 확인에 참고할 수 있는 공식 자료/사이트
  relatedNews?: RelatedNewsItem[];
}

export interface HistoryItem {
  id: string;
  insertedAt: string;
  articleText: string;
  result: AnalysisResult;
}

