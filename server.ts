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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
                  interpretation: { type: Type.STRING, description: "확정이 아닌 가능성 수준으로 작성된 해석 문장 (예: ~로 해석될 수 있습니다)" }
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
            needFurtherVerification: {
              type: Type.ARRAY,
              description: "3. 추가 확인 필요: 원문만으로 확인이 부족하여 공시나 공식 발표 확인이 필요한 항목들",
              items: { type: Type.STRING }
            },
            riskFactors: {
              type: Type.ARRAY,
              description: "4. 리스크 및 오해 가능성: 오해 가능 표현, 누락 정보, 과장 보도 가능성, 반대 해석 요인 목록",
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
              description: "추가로 확인해 볼 체크리스트 (2~3개)",
              items: { type: Type.STRING }
            },
            sourceCredibility: {
              type: Type.STRING,
              description: "추가 확인에 참고할 수 있는 출처 및 신뢰도 관련 정보"
            },
            authoritativeContext: {
              type: Type.ARRAY,
              description: "추가 확인에 참고할 수 있는 공식 기관 지표 및 사이트 자료 목록",
              items: { type: Type.STRING }
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
            "riskFactors",
            "glossary",
            "affectedSectors",
            "sourceCredibility",
            "authoritativeContext"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini AI로부터 빈 응답을 받았습니다.");
    }

    const parsed = JSON.parse(resultText);

    // 🔍 추가 실시간 정보: 구글 실시간 검색 연동하여 최신 관련 뉴스 3개 분석 및 조회
    let relatedNews = [];
    try {
      const searchPrompt = `구글 검색(Google Search)을 적극적으로 활용하여, 다음 주식/금융 소식의 주제와 밀접하게 연관된 실시간 최신 뉴스 기사, 공시 또는 신뢰할 수 있는 공식 발표자료 3개를 찾아주세요.
주제: "${parsed.title}"

반드시 최신 실제 정보(실제 기사 및 뉴스)를 검색하고, 검색 결과에서 확인된 실제 정보로만 아래 JSON 형식을 채워주세요. 절대 허구의 URL이나 가짜 기사를 생성하지 말고, 검색 결과에 나온 실제 존재하는 뉴스 및 URL을 기입해 주세요. 각 기사의 발행 날짜나 시간(예: '3시간 전', '2026-07-15')도 정확히 기입해야 합니다.`;

      const searchResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "구글 실시간 검색을 통한 최신 관련 뉴스 및 정보 목록 (3개)",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "실제 검색된 최신 뉴스 기사의 제목" },
                snippet: { type: Type.STRING, description: "해당 기사의 핵심 내용 요약 (1~2문장)" },
                source: { type: Type.STRING, description: "뉴스 출처 언론사 또는 기관명 (예: 연합뉴스, 매일경제, 금융감독원)" },
                url: { type: Type.STRING, description: "구글 검색 결과에서 확인된 실제 해당 기사의 URL 링크" },
                date: { type: Type.STRING, description: "기사 발행 시간 정보 (예: '2시간 전', '2026.07.15', '어제')" }
              },
              required: ["title", "snippet", "source", "url", "date"]
            }
          }
        }
      });

      if (searchResponse.text) {
        relatedNews = JSON.parse(searchResponse.text.trim());
      }
    } catch (searchError: any) {
      console.warn("Related News Search Notice (non-critical):", searchError?.message || searchError);
    }

    parsed.relatedNews = relatedNews;
    res.json(parsed);
  } catch (error: any) {
    console.error("Analysis API Error:", error?.message || error);
    const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    const userMsg = isRateLimit 
      ? "AI 요청 한도(Quota)가 일시적으로 초과되었습니다. 약 1분 후 다시 시도해 주세요." 
      : (error.message || "문서를 분석하는 도중 오류가 발생했습니다.");
    res.status(isRateLimit ? 429 : 500).json({ error: userMsg });
  }
});

// 💬 추가 심층 질문(Follow-up Q&A) API
app.post("/api/ask-followup", async (req, res) => {
  try {
    const { articleTitle, articleSummary, question, chatHistory } = req.body;

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

    const contextPrefix = `[참고 분석 문서 정보]\n제목: ${articleTitle || "분석 기사"}\n핵심 요약: ${articleSummary || "요약 내용 없음"}`;

    const messages = [
      { role: "user", parts: [{ text: contextPrefix }] },
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      })),
      { role: "user", parts: [{ text: question }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: messages,
      config: {
        systemInstruction: FOLLOWUP_SYSTEM_INSTRUCTION
      }
    });

    const reply = response.text || "죄송합니다. 답변을 생성하지 못했습니다.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Follow-up Q&A API Error:", error?.message || error);
    const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    const userMsg = isRateLimit 
      ? "AI 요청 한도(Quota)가 일시적으로 초과되었습니다. 약 1분 후 다시 질문해 주세요." 
      : (error.message || "질문에 답변하는 중 오류가 발생했습니다.");
    res.status(isRateLimit ? 429 : 500).json({ error: userMsg });
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
