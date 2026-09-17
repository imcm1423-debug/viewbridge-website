import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialisation of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 🛡️ Gemini API 503 일시적 부하(High Demand) 및 속도제한(429) 자동 재시도 및 모델 폴백 러너
async function runGeminiWithRetryAndFallback<T>(
  fn: (modelName: string) => Promise<T>,
  models: string[] = ["gemini-3.8-flash", "gemini-flash-latest"]
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const isDemandSpike =
          err?.status === 503 ||
          err?.code === 503 ||
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("temporarily");
        const isRateLimit =
          err?.status === 429 ||
          err?.code === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if ((isDemandSpike || isRateLimit) && attempt === 0) {
          console.warn(`[Gemini API] Temporary demand spike on model ${model} (attempt 1), retrying in 1.5s...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        if (isDemandSpike || isRateLimit) {
          console.warn(`[Gemini API] Model ${model} is currently unavailable. Trying fallback model...`);
          break; // Fallback to next model in list
        }

        // Non-transient error, throw immediately
        throw err;
      }
    }
  }

  throw lastError;
}

// 🛡️ 오류 객체/JSON 문자열을 안전하게 파싱하여 친절한 사용자 안내 메시지로 변환
function parseAndFormatGeminiError(error: any): { status: number; message: string } {
  const rawMsg = String(error?.message || error || "");
  let parsedCode: number | null = null;
  let parsedStatus: string | null = null;
  let parsedMsg: string | null = null;

  try {
    if (rawMsg.startsWith("{") && rawMsg.endsWith("}")) {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error) {
        parsedCode = parsed.error.code;
        parsedStatus = parsed.error.status;
        parsedMsg = parsed.error.message;
      }
    }
  } catch {}

  const code = parsedCode || error?.status || error?.code;
  const statusStr = String(parsedStatus || "").toUpperCase();
  const textToCheck = `${rawMsg} ${parsedMsg || ""}`.toUpperCase();

  if (code === 503 || statusStr === "UNAVAILABLE" || textToCheck.includes("503") || textToCheck.includes("HIGH DEMAND") || textToCheck.includes("UNAVAILABLE")) {
    return {
      status: 503,
      message: "현재 AI 모델 서버에 일시적인 트래픽(수요 급증)이 발생했습니다. 약 10~20초 후 다시 시도해 주세요."
    };
  }

  if (code === 429 || statusStr === "RESOURCE_EXHAUSTED" || textToCheck.includes("429") || textToCheck.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message: "AI 요청 한도(Quota)가 일시적으로 초과되었습니다. 약 1분 후 다시 시도해 주세요."
    };
  }

  return {
    status: 500,
    message: parsedMsg || (rawMsg.startsWith("{") ? "문서를 분석하는 도중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." : rawMsg)
  };
}

// Analysis API endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      res.status(400).json({ error: "분석할 내용(text)이 전달되지 않았습니다." });
      return;
    }

    const ai = getAIClient();

    const ANALYZE_SYSTEM_INSTRUCTION = `너는 초보 투자자의 이해를 돕는 금융 뉴스/문서 해설 도우미다.
금융 자문, 매수/매도 판단, 투자 권유, 수익 보장 표현을 절대로 제공하지 않는다.
모든 분석 결과는 참고용 해설로만 제공한다.
모든 결과는 확인된 사실, AI 해석, 추가 확인 필요, 리스크 및 오해 가능성 구조로 정리한다.
원문에서 확인되지 않는 내용은 사실처럼 말하지 않는다.
주식 뉴스가 아닌 정책/금융상품/제도 문서에는 호재·악재 판단을 표시하지 않는다.
매수, 매도, 추격 매수, 매수세, 매도세, 행동강령 같은 표현을 피하고 중립적인 확인 표현을 사용한다.

[반대 해석(counterPerspectives) 작성 규칙]
- 원문에 근거해 가능한 반대 해석을 1~2개 제시한다.
- 반대를 위한 반대나 근거 없는 부정적 주장을 만들지 않는다.
- 판단 근거가 부족하면 억지로 생성하지 않고 빈 배열([])을 반환한다.
- 외부 자료를 실제로 조회하지 않았다면 조회·검증했다고 표현하지 않는다.
- 매수·매도 추천을 하지 않는다.
- 정책·제도 문서는 투자 방향이 아닌 적용 조건·한계·다른 해석을 설명한다.

[개인정보 및 기밀정보 처리 규칙]
- 사용자가 입력한 내용에 주민등록번호, 계좌번호, 전화번호, 주소, 비밀번호, 내부 기밀, 계약서 원문, 미공개 투자정보 등 개인정보나 비밀정보가 포함되어 있는 것으로 판단되면:
  * 분석을 진행하지 마시고, "개인정보(주민등록번호, 계좌번호, 연락처 등)나 기밀정보가 포함되어 있어 분석을 진행할 수 없습니다. 해당 정보를 삭제 또는 비식별 처리한 후 다시 시도해 주세요."라는 메시지를 summary3Sec 및 sentimentReason에 명시하고 비식별 안내 결과를 전달하세요.

[기본 작성 규칙 및 금융 안전 지침]
1. 투자 자문 및 수익 보장 금지: 투자 자문, 매수/매도 판단, 수익 보장 표현을 하지 말고 결과는 참고용 해설로만 제공하세요.
2. 투자 행동 표현 제한: "추격 매수", "매수", "매도", "매수세", "매도세" 등의 표현은 금지하거나 피하고, 필요할 경우 "관심 증가", "자금 흐름", "거래 흐름", "수급 변화"처럼 중립적인 용어로 표현하세요.
3. 체크리스트(actionPlan) 가이드형 표현: 명령형 표현("확인하십시오", "모니터링하십시오" 등)을 피하고, "~확인해 볼 수 있습니다", "~살펴볼 수 있습니다"와 같이 부드러운 가능성 및 체크 가이드 표현으로 작성해 주세요.
4. 긍정적 시사점 중립 표현: "긍정 요인 가능성" 대신 "긍정적으로 해석될 수 있는 배경"과 같이 중립적이고 신중한 표현을 사용해 주세요.
5. 가설 수준 표현: 단 한 번도 "확정적인 사실"로 단정짓지 말고, 반드시 "~로 해석될 수 있음", "~의 가능성이 존재함" 등과 같이 가설 및 가능성 수준으로 표현하세요.

[공통 4대 출력 구조]
1. 확인된 사실 (verifiedFacts): 원문에서 직접 확인되는 순수한 객관적 팩트만 작성 (fact, quote)
2. AI 해석 (aiInterpretations): 원문 사실을 바탕으로 가능한 해석만 작성 ("~로 해석될 수 있음", "가능성이 있음"). "확정", "무조건", "사야 한다", "팔아야 한다" 표현 금지.
3. 추가 확인 필요 (needFurtherVerification): 원문만으로 확인할 수 없는 내용 (DART 공시, 공식 발표, 추가 보도)
4. 리스크 및 오해 가능성 (riskFactors): 오해 가능 표현, 누락 정보, 과장 보도 가능성, 반대 해석 요인

[문서 유형별 처리 예시]
- 예시 1. 주식 뉴스 ("코스닥 급등, 바이오·소부장 강세, 사이드카 발동"):
  * AI 해석 방향은 호재/악재/중립 표시 가능 (단, "긍정적으로 해석될 수 있는 배경"처럼 신중히 표현).
  * "매수", "추격 매수", "매도" 같은 행동 표현 금지.
  * 체크리스트는 "DART 공시를 확인해 볼 수 있습니다", "KRX 지표를 살펴볼 수 있습니다"처럼 작성.

- 예시 2. 금융상품/정책 문서 ("청년미래적금 가입자 138만 명, 추가 접수 검토", 예금, 적금, 정부 지원제도 등):
  * isPolicyDoc를 true로 설정.
  * sentiment는 "neutral"로 설정.
  * sentimentReason은 반드시 "해당 문서는 특정 종목의 투자 판단 대상이 아니므로, 호재/악재 판단 대신 제도 이해 중심으로 해석합니다."로 작성.
  * AI 해석은 가입 현황, 추가 접수 가능성, 신청 절차 및 제도 이해 중심.
  * 체크리스트는 "공고 일정을 확인해 볼 수 있음", "필수 서류를 살펴볼 수 있음"처럼 작성.

- 예시 3. 기업 실적 발표 ("A기업 매출 20% 증가, 영업이익 감소"):
  * 확인된 사실: 매출 증가와 영업이익 감소 팩트를 명확히 분리.
  * AI 해석: 매출 성장과 수익성 악화를 동시에 신중히 설명.
  * 리스크: 매출 증가만 보고 긍정적으로 오해할 수 있음을 기재.
  * 추가 확인: 비용 증가 원인, 일회성 비용 여부, 다음 분기 가이던스 확인 가이드.

- 예시 4. 루머/커뮤니티성 정보 ("커뮤니티에서 특정 기업 인수설 확산"):
  * 확인된 사실: "커뮤니티 및 찌라시에서 언급됨" 정도의 사실만 작성.
  * AI 해석: 미확인 정보이므로 투자 판단 근거로 삼기 어렵다고 설명.
  * 추가 확인 필요: 회사 공식 공시, 거래소 조회공시 요구, 공식 입장 발표.
  * 리스크: 미확인 소문 기반 판단의 위험성 강조.

- 예시 5. 거시경제 뉴스 ("미국 고용 둔화, 금리 인하 기대 확대"):
  * 확인된 사실: 고용 지표 및 금리 관련 수치 팩트 정리.
  * AI 해석: 성장주 및 증시에 긍정 영향 가능성과 경기 둔화 우려 동시 설명.
  * 리스크: 금리 인하 기대감과 경기 침체 리스크가 공존할 수 있음을 지적.
  * 추가 확인: FOMC 발표문, CPI, 고용보고서 원문 자료.`;

    const response = await runGeminiWithRetryAndFallback((modelName) =>
      ai.models.generateContent({
        model: modelName,
      contents: text,
      config: {
        systemInstruction: ANALYZE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { 
              type: Type.STRING, 
              description: "기사의 핵심 주제를 직관적으로 파악할 수 있는 제목" 
            },
            isPolicyDoc: {
              type: Type.BOOLEAN,
              description: "정책, 청년미래적금, 예금/적금, 정부 지원제도 등 비종목 문서인 경우 true"
            },
            summary3Sec: { 
              type: Type.STRING, 
              description: "3초 핵심 요약 문장" 
            },
            verifiedFacts: {
              type: Type.ARRAY,
              description: "1. 확인된 사실: 원문에서 직접 확인되는 내용 및 원문 근거 문장 목록",
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING, description: "원문에서 직접 확인된 핵심 팩트" },
                  quote: { type: Type.STRING, description: "해당 팩트를 뒷받침하는 원문 안의 실제 근거 문장 구절" }
                },
                required: ["fact", "quote"]
              }
            },
            aiInterpretations: {
              type: Type.ARRAY,
              description: "2. AI 해석: 호재/악재/중립 판단 및 '~로 해석될 수 있음' 수준의 시사점 목록",
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "해석의 핵심 주제/이슈" },
                  sentiment: { type: Type.STRING, enum: ["bullish", "bearish", "neutral"], description: "방향성" },
                  interpretation: { type: Type.STRING, description: "확정이 아닌 가능성 수준으로 작성된 해석 문장 (예: ~로 해석될 수 있습니다)" },
                  reasoning: { type: Type.STRING, description: "해당 해석이 도출된 배경 원인 및 맥락 근거" }
                },
                required: ["topic", "sentiment", "interpretation"]
              }
            },
            sentiment: { 
              type: Type.STRING, 
              enum: ["bullish", "bearish", "neutral"],
              description: "전반적인 방향성 종합 (bullish: 긍정적으로 해석될 수 있는 배경이 일부 확인됨, bearish: 유의 요인이 일부 확인됨, neutral: 중립/비종목)" 
            },
            sentimentReason: { 
              type: Type.STRING, 
              description: "위 방향성 해석에 대한 참고용 설명 (비종목인 경우 '해당 문서는 특정 종목의 투자 판단 대상이 아니므로, 호재/악재 판단 대신 제도 이해 중심으로 해석합니다.')" 
            },
            impactScore: { 
              type: Type.INTEGER, 
              description: "참고용 영향 범위 기준 (1~5 정수)" 
            },
            counterPerspectives: {
              type: Type.ARRAY,
              description: "원문에 근거해 가능한 반대 해석 1~2개 (판단 근거 부족 시 빈 배열 반환)",
              items: {
                type: Type.OBJECT,
                properties: {
                  interpretation: { type: Type.STRING, description: "기존 주요 해석과 다르게 볼 수 있는 관점" },
                  reasoning: { type: Type.STRING, description: "그런 해석이 가능한 이유" },
                  evidenceToCheck: { type: Type.STRING, description: "어느 해석이 더 타당한지 판단하기 위해 추가로 확인할 자료나 조건" }
                },
                required: ["interpretation", "reasoning", "evidenceToCheck"]
              }
            },
            needFurtherVerification: {
              type: Type.ARRAY,
              description: "3. 추가 확인 필요: 원문만으로 확인이 부족하여 DART 전자공시나 공식 발표 확인이 필요한 항목들 (2~3개)",
              items: { type: Type.STRING }
            },
            riskFactors: {
              type: Type.ARRAY,
              description: "4. 리스크: 이면의 구조적 리스크, 고정비 부담, 과장 보도 가능성 등 투자 경고 사항",
              items: { type: Type.STRING }
            },
            misconceptions: {
              type: Type.ARRAY,
              description: "초보 투자자가 기사 내용만 보고 섣불리 오해하거나 착각하기 쉬운 주의점 및 팩트체크 진실 (2~3개)",
              items: { type: Type.STRING }
            },
            glossary: {
              type: Type.ARRAY,
              description: "초보자가 이해하기 어려운 경제/금융 전문 용어 해설 사전 (최대 4개)",
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: "용어 이름" },
                  definition: { type: Type.STRING, description: "초보자 눈높이의 쉬운 용어 설명" }
                },
                required: ["term", "definition"]
              }
            },
            affectedSectors: {
              type: Type.ARRAY,
              description: "연관 업종 및 테마 영향성 분석 (긍정적/유의 요인)",
              items: {
                type: Type.OBJECT,
                properties: {
                  sector: { type: Type.STRING, description: "연관 업종/테마 명칭" },
                  direction: { type: Type.STRING, enum: ["up", "down"], description: "방향성 (up: 긍정 영향, down: 유의 영향)" },
                  reason: { type: Type.STRING, description: "영향 원인 설명 (~로 분석될 수 있음)" }
                },
                required: ["sector", "direction", "reason"]
              }
            },
            actionPlan: {
              type: Type.ARRAY,
              description: "초보자를 위한 당장 대응 및 실천 리스크 체크리스트 (2~3개)",
              items: { type: Type.STRING }
            },
            sourceCredibility: {
              type: Type.STRING,
              description: "추가 확인에 참고할 수 있는 출처 및 신뢰도 관련 정보 (DART, 공식 보도 등 객관적 신뢰성 평가)"
            },
            authoritativeContext: {
              type: Type.ARRAY,
              description: "추가 확인에 참고할 수 있는 공식 기관 지표 및 사이트 자료 목록 (예: 금융감독원 전자공시시스템(DART), 한국거래소(KRX) 정보데이터시스템 등)",
              items: { type: Type.STRING }
            },
            relatedNews: {
              type: Type.ARRAY,
              description: "기사 주제와 직결된 실시간 추가 뉴스 또는 교차 검증 참고 소식 2~3개",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "연관 뉴스 기사 제목" },
                  snippet: { type: Type.STRING, description: "핵심 요약 1~2문장" },
                  source: { type: Type.STRING, description: "언론사 또는 공식 기관명 (예: 연합뉴스, 매일경제, 금융감독원)" },
                  url: { type: Type.STRING, description: "구글 검색 또는 공식 참고 링크 URL" },
                  date: { type: Type.STRING, description: "발행 시점 (예: 2시간 전, 최근)" }
                },
                required: ["title", "snippet", "source", "url", "date"]
              }
            }
          },
          required: [
            "title",
            "summary3Sec",
            "verifiedFacts",
            "aiInterpretations",
            "sentiment",
            "sentimentReason",
            "impactScore",
            "needFurtherVerification",
            "counterPerspectives",
            "riskFactors",
            "misconceptions",
            "glossary",
            "affectedSectors",
            "sourceCredibility",
            "authoritativeContext"
          ]
        }
      }
    })
  );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini AI로부터 빈 응답을 받았습니다.");
    }

    const parsed = JSON.parse(resultText);

    // 🔍 검색 실행 여부 및 실제 검색 근거 확인 여부를 서버 코드가 직접 판정
    // 무조건 추가 검색을 호출하여 불필요한 AI Quota 및 비용을 낭비하지 않으며,
    // Google Search 실제 grounding 메타데이터가 확인되지 않은 경우 '검색 미수행/근거 미확인'으로 서버가 확정합니다.
    parsed.searchStatus = "not_grounded";
    parsed.relatedNews = [];
    parsed.counterPerspectives = Array.isArray(parsed.counterPerspectives)
      ? parsed.counterPerspectives
      : [];

    // Compatibility aliases for frontend components
    parsed.aiInterpretation = parsed.aiInterpretations || [];
    parsed.risks = parsed.riskFactors || [];
    parsed.beginnerChecklist = parsed.actionPlan || [];
    parsed.terms = (parsed.glossary || []).map((g: any) => ({
      term: g.term,
      meaning: g.definition || g.meaning || "",
      definition: g.definition || g.meaning || ""
    }));

    res.json(parsed);
  } catch (error: any) {
    console.error("Analysis API Error:", error?.message || error);
    const { status, message } = parseAndFormatGeminiError(error);
    res.status(status).json({ error: message });
  }
});

// 💬 추가 심층 질문(Follow-up Q&A) API - /api/chat 및 /api/ask-followup 둘 다 지원
app.post(["/api/ask-followup", "/api/chat"], async (req, res) => {
  try {
    const { articleTitle, articleSummary, question, chatHistory, context } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "질문 내용을 입력해 주세요." });
    }

    const ai = getAIClient();

    const FOLLOWUP_SYSTEM_INSTRUCTION = `너는 초보 투자자의 이해를 돕는 금융 뉴스/문서 해설 도우미다.
현재 사용자가 해설 리포트를 확인한 후 추가 문의를 진행하고 있다.
금융 자문, 매수/매도 판단, 투자 권유, 수익 보장 표현을 절대로 제공하지 않는다.
결과는 참고용 해설로만 제공한다.
모든 답변은 확인된 사실과 추가 확인 포인트를 중심으로 신중하게 작성한다.

[개인정보 및 기밀정보 처리 규칙]
- 사용자의 질문이나 추가 입력 내용에 주민등록번호, 계좌번호, 전화번호, 주소, 비밀번호, 내부 기밀, 미공개 투자정보 등 개인정보나 비밀정보가 포함된 경우:
  * 질문 답변을 진행하지 말고, "개인정보나 기밀정보가 포함되어 있어 답변할 수 없습니다. 해당 정보를 삭제 또는 비식별 처리한 후 질문해 주세요."라고 안내하세요.

[매수/매도 판단 질문 대응 원칙]
사용자가 "사도 되나요?", "팔아야 하나요?", "사야 할까요?", "투자해도 될까요?" 등 직접적인 매수/매도 여부나 투자 의사결정을 질문하는 경우:
1. 절대로 매수/매도 추천이나 확정적인 투자의견, 수익 보장 표현을 제공하지 마십시오.
2. "본 도우미는 개별 종목의 매수/매도 의사결정, 투자 자문, 수익 보장을 제공하지 않습니다"라는 점을 정중하게 먼저 밝히십시오.
3. 대신, 기사 원문에서 확인된 객관적 사실(verifiedFacts)과 공시, 실적, 지표 등 사용자가 스스로 판단할 때 추가로 확인해 볼 만한 체크 포인트만을 중립적으로 설명하세요.

[대화 원칙]
1. 투자 행동 표현 제한: "추격 매수", "매수", "매도", "매수세", "매도세", "행동강령" 등의 표현은 금지하거나 피하고, "관심 증가", "자금 흐름", "거래 흐름", "수급 변화" 등 중립 용어를 사용하세요.
2. 단정적 표현 금지: 문장은 확정 표현이 아닌 "~로 해석될 수 있습니다", "~의 가능성이 있습니다" 수준으로 작성하세요.
3. 사실과 해석 구분: 입력 원문에서 확인 가능한 팩트와 가설 수준의 AI 해석을 구분하여 명확히 답변하세요.
4. 친절하고 가독성 높은 설명: 초보자가 쉽게 이해할 수 있도록 깔끔한 개조식과 쉬운 표현을 활용하세요.`;

    const contextPrefix = context 
      ? `[참고 분석 문서 컨텍스트]\n${typeof context === "string" ? context : JSON.stringify(context)}`
      : `[참고 분석 문서 정보]\n제목: ${articleTitle || "분석 기사"}\n핵심 요약: ${articleSummary || "요약 내용 없음"}`;

    const messages = [
      { role: "user", parts: [{ text: contextPrefix }] },
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: question }] }
    ];

    const response = await runGeminiWithRetryAndFallback((modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: messages,
        config: {
          systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION
        }
      })
    );

    const reply = response.text || "죄송합니다. 답변을 생성하지 못했습니다.";
    res.json({ reply, answer: reply });
  } catch (error: any) {
    console.error("Follow-up Q&A API Error:", error?.message || error);
    const { status, message } = parseAndFormatGeminiError(error);
    res.status(status).json({ error: message });
  }
});

// Configure Vite or production static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
