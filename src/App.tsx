import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  Trash2, 
  Clock,
  RefreshCw,
  Info,
  Search,
  LogOut,
  HardDrive,
  Shield,
  Globe,
  ArrowUpDown,
  Upload,
  Download,
  Copy,
  MessageSquare,
  Send,
  Check,
  ZoomIn,
  ZoomOut,
  FileUp,
  Link as LinkIcon,
  ChevronRight,
  Eye,
  Lightbulb,
  Link2,
  Lock,
  ExternalLink,
  FileSearch,
  ShieldAlert,
  User as UserIcon
} from "lucide-react";
import { SAMPLE_ARTICLES, SampleArticle } from "./data/samples.ts";
import { AnalysisResult, HistoryItem } from "./types.ts";
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from "./firebase.ts";
import { User } from "firebase/auth";
import { ViewBridgeLogo } from "./components/ViewBridgeLogo.tsx";
import { BrandGuideModal } from "./components/BrandGuideModal.tsx";

// 💡 구글 미로그인 상태에서도 제약 없이 체험할 수 있는 데모 드라이브 문서들
const DEMO_DRIVE_FILES = [
  {
    id: "demo-1",
    name: "[체험용 공시] 삼성전자 HBM4 차세대 반도체 개발 및 주요 빅테크 수주 계약건.gdoc",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date().toISOString(),
    size: 15420,
    category: "IT / 반도체",
    readTime: "2분 소요",
    content: `삼성전자가 AI 반도체 핵심 부품인 차세대 HBM4(6세대 고대역폭 메모리) 개발을 완료하고 글로벌 주요 AI 빅테크 기업들과 장기 공급 계약을 체결했다고 발표했습니다. 이번 HBM4는 기존 HBM3E 대비 전력 효율이 30% 개선되었으며, 데이터 처리 속도는 1.5배 상향되었습니다. 산업통상자원부 자료에 따르면 올해 글로벌 HBM 시장 규모는 전년 대비 82% 성장이 예상되며, 국내 반도체 패키징 및 테스트 장비 관련 소부장 기업들의 실적 개선 가능성에 긍정적 배경이 될 것으로 전망됩니다.`
  },
  {
    id: "demo-2",
    name: "[체험용 보고서] 한국은행 기준금리 인하 결정 및 금융 시장 유동성 영향.txt",
    mimeType: "text/plain",
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
    size: 8900,
    category: "거시 경제",
    readTime: "2분 소요",
    content: `한국은행 금융통화위원회가 오늘 기준금리를 기존 대비 0.25%p 인하하기로 전격 결정했습니다. 이번 금리 인하로 시중 대출 금리 부담이 경감됨에 따라 금융권 대출 자산 건전성이 개선되고 부동산 및 주식 시장 유동성 공급이 가속화될 전망입니다. 반면 고금리 기조 수혜를 입던 주요 시중은행의 순이자마진(NIM) 축소 우려는 리스크 요인으로 꼽힙니다.`
  },
  {
    id: "demo-3",
    name: "[체험용 바이오] 면역항암제 글로벌 임상 3상 대성공 및 미국 FDA 승인 신청 계획.gdoc",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date(Date.now() - 172800000).toISOString(),
    size: 22100,
    category: "바이오 / 제약",
    readTime: "3분 소요",
    content: `국내 주요 바이오 벤처 기업이 신규 면역항암제 후보물질의 글로벌 3상 임상시험에서 1차 평가 지표를 충족하며 유의미한 치료 효능을 입증했습니다. 회사 측은 내년 상반기 미국 FDA에 품목허가 승인을 신청할 계획입니다. 전문가들은 성공 가능성이 높으나 경쟁 약물의 신규 출시 일정과 판권 계약 조건에 따라 실제 매출 발생 시기가 유동적일 수 있음을 경고했습니다.`
  },
  {
    id: "demo-4",
    name: "[체험용 정책] 2026 청년미래적금 출시 안내 및 정부 기여금 혜택 가이드.gdoc",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date(Date.now() - 250000000).toISOString(),
    size: 11200,
    category: "정부 정책 / 제도",
    readTime: "1분 소요",
    content: `금융위원회가 청년층 자산 형성을 유도하기 위한 '2026 청년미래적금' 가이드라인을 발표했습니다. 만 19세~34세 청년을 대상으로 월 최대 70만원 납입 시 정부가 매월 최대 6%의 기여금을 매칭해 지급하며, 이자소득 전액 비과세 혜택이 적용됩니다. 본 문서는 정책 및 저축 제도 안내 문서로 특정 종목이나 주식 투자와는 직접 관련이 없습니다.`
  }
];

const TEST_ACCESS_PASSWORD = "mibok-test-0811";

export default function App() {
  // 🔐 비밀번호 접근 잠금 상태 (제한 테스트용)
  const [isPasswordAuthed, setIsPasswordAuthed] = useState<boolean>(() => {
    return localStorage.getItem("mibok_test_access_granted") === "true";
  });
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === TEST_ACCESS_PASSWORD) {
      localStorage.setItem("mibok_test_access_granted", "true");
      setIsPasswordAuthed(true);
      setPasswordError(null);
    } else {
      setPasswordError("테스트 참여자에게 공유된 비밀번호를 확인해 주세요.");
    }
  };

  // 🛡️ 분석 실행 전 동의 체크박스 상태
  const [isComplianceChecked, setIsComplianceChecked] = useState<boolean>(false);

  // 🏷️ 카테고리 필터 칩 상태 (레퍼런스 이미지 스타일 반영)
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // 🏛️ 브랜드 가이드 모달 상태
  const [isBrandGuideOpen, setIsBrandGuideOpen] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [tab, setTab] = useState<"direct" | "file" | "drive">("direct");
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState<number>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [newsSortOrder, setNewsSortOrder] = useState<"relevance" | "latest">("relevance");

  // UX & Advanced Features States
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // 🎯 분석 결과 화면 자동 포커스 및 스크롤 참조
  const resultContainerRef = useRef<HTMLDivElement>(null);

  // 🚀 자동 스크롤: 분석 결과가 생성되거나 변경되면 결과 화면으로 매끄럽게 자동 이동
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        resultContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Google Drive states
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [fetchingDrive, setFetchingDrive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fetchingDocContent, setFetchingDocContent] = useState<boolean>(false);

  // Helper to dynamically sort retrieved news articles
  const getSortedNews = () => {
    if (!result || !result.relatedNews) return [];
    if (newsSortOrder === "relevance") {
      return result.relatedNews;
    }
    return [...result.relatedNews].sort((a, b) => {
      const getWeight = (dateStr: string) => {
        if (!dateStr) return 999999;
        const lower = dateStr.toLowerCase().trim();
        if (lower.includes("초") && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val;
        }
        if (lower.includes("분") && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val * 60;
        }
        if (lower.includes("시간") && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val * 3600;
        }
        if (lower.includes("일") && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val * 86400;
        }
        if (lower.includes("주") && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val * 86400 * 7;
        }
        if ((lower.includes("달") || lower.includes("개월")) && lower.includes("전")) {
          const val = parseInt(lower) || 1;
          return val * 86400 * 30;
        }
        const cleaned = dateStr.replace(/[^0-9]/g, "");
        if (cleaned.length >= 8) {
          return -parseInt(cleaned.slice(0, 8));
        }
        if (cleaned.length > 0) {
          return -parseInt(cleaned);
        }
        return 86400 * 365;
      };
      return getWeight(a.date) - getWeight(b.date);
    });
  };

  // Loading animation tips for beginner investors
  const loadingTips = [
    "ViewBridge 관찰 엔진: 원문의 핵심 사실과 통계를 추출 중입니다...",
    "ViewBridge 이해 엔진: 복잡한 금융 용어를 알기 쉬운 일상어로 변환 중입니다...",
    "ViewBridge 연결 엔진: 관련 시장 파급 범위와 추가 확인 사항을 매핑 중입니다...",
    "ViewBridge 개선 엔진: 초보 투자자를 위한 오해 방지 및 리스크 체크리스트를 정리 중입니다..."
  ];

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setUser(user);
        setToken(cachedToken);
        setNeedsAuth(false);
        fetchDriveFiles(cachedToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stock_analysis_history_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setHistory(parsed);
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  }, []);

  // Interval for changing loading tips
  useEffect(() => {
    let interval: any;
    if (loading || fetchingDocContent) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 3000);
    } else {
      setLoadingTipIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading, fetchingDocContent]);

  // Google Sign In Handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        setNeedsAuth(false);
        fetchDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.message?.includes("popup-closed-by-user")
      ) {
        return;
      }
      console.error("Login failed:", err);
      setError("구글 인증 및 로그인에 실패했습니다. 팝업 창 차단 설정을 확인해 보세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Sign Out Handler
  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Sign out failed:", err);
    }
  };

  // Google Drive Files fetcher
  const fetchDriveFiles = async (accessToken: string) => {
    setFetchingDrive(true);
    setError(null);
    try {
      const query = "mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain'";
      const fields = "files(id, name, mimeType, modifiedTime, size)";
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&fields=${encodeURIComponent(fields)}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setNeedsAuth(true);
          setToken(null);
          throw new Error("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        }
        throw new Error("구글 드라이브 목록을 불러오지 못했습니다.");
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "구글 드라이브 데이터 조회 중 문제가 발생했습니다.");
    } finally {
      setFetchingDrive(false);
    }
  };

  // Download/Export selected document content
  const fetchFileContentText = async (fileId: string, mimeType: string, accessToken: string): Promise<string> => {
    if (mimeType === "application/vnd.google-apps.document") {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error("선택하신 구글문서에서 텍스트 내용을 추출할 수 없습니다. (권한 또는 공유 설정을 확인해 주세요)");
      }
      return await res.text();
    } else if (mimeType === "text/plain") {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error("텍스트 파일 본문 다운로드에 실패했습니다.");
      }
      return await res.text();
    } else {
      throw new Error("Word(.docx) 파일은 구글문서로 먼저 변환한 후 분석하시거나, 직접 입력 탭에서 복사하여 진행해 주세요.");
    }
  };

  const handleAnalyzeDriveFile = async (file: any) => {
    if (file.content) {
      handleAnalyzeDemoFile(file);
      return;
    }

    if (!token) {
      setError("구글 로그인 인증이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHistoryId(null);
    setChatMessages([]);

    try {
      const textContent = await fetchFileContentText(file.id, file.mimeType, token);
      if (!textContent || textContent.trim() === "") {
        throw new Error("선택한 문서에 텍스트 본문이 비어있거나 읽을 수 없습니다.");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textContent }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "문서 분석 보고서 생성이 일시적으로 실패했습니다.");
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
      saveToHistory(`[Google Drive: ${file.name}]\n\n` + textContent, data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "문서 분석 중 일시적인 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 데모 문서 직접 분석 핸들러
  const handleAnalyzeDemoFile = async (demoFile: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHistoryId(null);
    setChatMessages([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: demoFile.content }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "체험 문서 분석 생성이 실패했습니다.");
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
      saveToHistory(`[체험용 문서: ${demoFile.name}]\n\n` + demoFile.content, data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "데모 문서 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로컬 파일 (.txt, .md) 읽기 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
        setTab("direct");
      }
    };
    reader.readAsText(file);
  };

  // 💡 비종목 문서 판별
  const checkIsPolicyDoc = (res: AnalysisResult): boolean => {
    if (res.isPolicyDoc) return true;
    if (res.sentimentReason?.includes("투자 판단 대상이 아니므로") || res.sentimentReason?.includes("제도 이해 중심")) return true;
    const combined = (res.title + " " + res.summary3Sec + " " + (res.sentimentReason || "")).toLowerCase();
    const policyKeywords = ["청년미래적금", "청년도약계좌", "청년희망적금", "예금", "적금", "지원금", "제도 안내", "정책 안내", "비과세 혜택", "지원제도"];
    return policyKeywords.some(kw => combined.includes(kw));
  };

  // 📄 4대 안전 구조 기반 리포트 텍스트 생성기 (ViewBridge 포맷)
  const generateReportText = (res: AnalysisResult): string => {
    const isPolicy = checkIsPolicyDoc(res);

    const formatSection = (title: string, content: string | null | undefined, fallbackMsg?: string) => {
      const fallback = fallbackMsg || "원문만으로는 확인된 내용이 부족합니다.";
      const body = content && content.trim().length > 0 ? content.trim() : fallback;
      return `------------------------------------------------\n${title}\n------------------------------------------------\n${body}`;
    };

    const verifiedFactsContent = (res.verifiedFacts && res.verifiedFacts.length > 0)
      ? res.verifiedFacts.map((fact, idx) => {
          let line = `${idx + 1}. [사실] ${fact.fact}`;
          if (fact.quote) {
            line += `\n   ↳ 원문 근거: "${fact.quote}"`;
          }
          return line;
        }).join("\n")
      : (res.summary3Sec || "원문에서 확인된 사실 요약이 제공되지 않았습니다.");

    const aiList = res.aiInterpretations || res.aiInterpretation || [];
    const aiInterpretationContent = (aiList.length > 0)
      ? aiList.map((inter, idx) => {
          let line = `${idx + 1}. [해석] ${inter.interpretation}`;
          if (inter.reasoning) {
            line += `\n   ↳ 배경/이유: ${inter.reasoning}`;
          }
          return line;
        }).join("\n")
      : (res.sentimentReason || "AI 해석 내용이 제공되지 않았습니다.");

    const needFurtherVerificationContent = (res.needFurtherVerification && res.needFurtherVerification.length > 0)
      ? res.needFurtherVerification.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
      : "원문 외에 추가 확인이 필요한 의존 사항이 기재되지 않았습니다.";

    const risksList = res.riskFactors || res.risks || [];
    const risksContent = (risksList.length > 0)
      ? risksList.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
      : (res.beginnerCaution || "특별한 리스크 사항이 명시되지 않았습니다.");

    const misconceptionsList = res.misconceptions || [];
    const misconceptionsContent = (misconceptionsList.length > 0)
      ? misconceptionsList.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
      : "초보자가 흔히 오해하기 쉬운 지점이 명시되지 않았습니다.";

    const checklistList = res.actionPlan || res.beginnerChecklist || [];
    const checklistContent = (checklistList.length > 0)
      ? checklistList.map((item, idx) => `[ ] ${item}`).join("\n")
      : "[ ] 본 리포트는 참고용이며, 공식 공시 및 후속 기사를 지속적으로 확인하세요.";

    const termsList = res.glossary || res.terms || [];
    const glossaryContent = (termsList.length > 0)
      ? termsList.map((term, idx) => `${idx + 1}. ${term.term}: ${term.definition || term.meaning || ""}`).join("\n")
      : "별도 설명된 핵심 용어가 없습니다.";

    const sourceContent = (res.relatedNews && res.relatedNews.length > 0)
      ? res.relatedNews.map((news, idx) => `${idx + 1}. [${news.source}] ${news.title} (${news.date}) - ${news.url}`).join("\n")
      : (res.sourceInfo ? `원문 출처: ${res.sourceInfo.sourceName || "제공 원문"} (작성일: ${res.sourceInfo.date || "미상"})` : res.sourceCredibility || "출처 정보가 포함되지 않았습니다.");

    const marketImpactStr = isPolicy
      ? "해당 없음 (정책/제도 안내 문서)"
      : `${res.impactScore}/5 단계`;

    const signalStr = isPolicy
      ? "해당 문서는 특정 종목의 투자 판단 대상이 아니므로 호재/악재 판단 대신 제도 이해 중심으로 해석합니다."
      : res.sentiment === "bullish"
      ? "긍정적으로 해석될 수 있는 배경이 일부 확인됨"
      : res.sentiment === "bearish"
      ? "유의 요인이 일부 확인됨"
      : "중립 요인 및 관련 영향 관망";

    let reportText = `================================================
[ViewBridge] 금융 뉴스/문서 참고용 해설 리포트
Observation-driven Product Design
================================================
제목: ${res.title}
3초 핵심 요약: ${res.summary3Sec}
분석 일시: ${new Date().toLocaleString("ko-KR")}
참고용 영향 범위: ${marketImpactStr}
AI 해석 방향: ${signalStr}

${formatSection("1. 확인된 사실 (Observe)", verifiedFactsContent, "원문만으로는 확인된 내용이 부족합니다.")}

${formatSection("2. AI 해석 (Understand)", aiInterpretationContent, "AI 해석 내용이 제공되지 않았습니다.")}

${formatSection("3. 추가 확인 필요 (Connect)", needFurtherVerificationContent, "추가 확인 필요 항목이 없습니다.")}

${formatSection("4. 리스크 및 오해 방지 (Improve)", `[주의해야 할 리스크 요인]\n${risksContent}\n\n[초보자가 흔히 하는 오해와 진실]\n${misconceptionsContent}`)}

${formatSection("5. 초보 투자자 실행 체크리스트", checklistContent)}

${formatSection("6. 핵심 금융 용어 사전", glossaryContent, "별도 설명된 용어가 없습니다.")}

${formatSection("7. 추가 확인 참고 자료 및 출처 정보", sourceContent, "추가 출처 정보가 명시되지 않았습니다.")}

------------------------------------------------
[개인정보 및 비밀정보 보호 안내]
이 서비스는 금융 뉴스와 문서 이해를 돕는 참고용 도구입니다.
주민등록번호, 계좌번호, 전화번호, 주소, 비밀번호, 내부자료, 미공개 정보, 계약서 원문 등 개인정보나 기밀정보는 입력하지 마세요.
입력한 내용은 AI 분석을 위해 Gemini API로 전송될 수 있습니다.
본 서비스는 투자 자문, 매수·매도 추천, 수익 보장을 제공하지 않습니다.

※ 안내사항: 데모 문서는 기능 체험을 위한 예시이며, 실제 투자 판단에 사용하지 마세요.
------------------------------------------------
`;

    return reportText;
  };

  const handleCopyReport = async () => {
    if (!result) return;
    try {
      const text = generateReportText(result);
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      console.error("복사 실패", e);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    try {
      const text = generateReportText(result);
      const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (result.title || "분석리포트").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 30);
      link.href = url;
      link.download = `[ViewBridge_리포트]_${safeTitle}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("다운로드 실패", e);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !result || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg,
          articleTitle: result.title,
          articleSummary: result.summary3Sec,
          chatHistory: chatMessages,
          context: JSON.stringify({
            title: result.title,
            summary: result.summary3Sec,
            verifiedFacts: result.verifiedFacts,
            aiInterpretations: result.aiInterpretations || result.aiInterpretation,
            needFurtherVerification: result.needFurtherVerification,
            risks: result.riskFactors || result.risks,
            misconceptions: result.misconceptions,
            terms: result.glossary || result.terms
          }),
        }),
      });

      if (!res.ok) throw new Error("질문 답변을 불러오지 못했습니다.");
      const data = await res.json();
      const reply = data.reply || data.answer || "답변을 생성하지 못했습니다.";
      setChatMessages([...newHistory, { role: "ai" as const, content: reply }]);
    } catch (e: any) {
      setChatMessages([...newHistory, { role: "ai" as const, content: "일시적인 오류로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const saveToHistory = (originalText: string, res: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title: res.title || "무제 분석 건",
      date: new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      sentiment: res.sentiment,
      impactScore: res.impactScore,
      summary: res.summary3Sec,
      result: res,
      inputText: originalText
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev.slice(0, 19)];
      try {
        localStorage.setItem("stock_analysis_history_v1", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setResult(item.result);
    setInputText(item.inputText);
    setChatMessages([]);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("stock_analysis_history_v1", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("모든 분석 기록을 삭제하시겠습니까?")) {
      setHistory([]);
      try {
        localStorage.removeItem("stock_analysis_history_v1");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAnalyzeDirectInput = async (customText?: string) => {
    const textToAnalyze = typeof customText === "string" ? customText : inputText;
    if (!textToAnalyze.trim()) {
      setError("분석할 금융 뉴스나 문서 본문을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHistoryId(null);
    setChatMessages([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "분석 요청에 실패했습니다.");
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
      saveToHistory(textToAnalyze, data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Filter samples based on category
  const filteredSamples = SAMPLE_ARTICLES.filter((sample) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "IT/반도체") return sample.category.includes("IT") || sample.category.includes("반도체");
    if (activeCategory === "주식/배당") return sample.category.includes("배당") || sample.category.includes("주식");
    if (activeCategory === "거시 경제") return sample.category.includes("거시") || sample.category.includes("Macro");
    if (activeCategory === "원자재/에너지") return sample.category.includes("원자재") || sample.category.includes("에너지");
    if (activeCategory === "정부 정책") return sample.category.includes("정책") || sample.category.includes("적금");
    return true;
  });

  const filteredDriveFiles = driveFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔐 비밀번호 잠금 화면 (앱 공개 전 제한 테스트 전용 - ViewBridge 브랜딩 적용)
  if (!isPasswordAuthed) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans antialiased text-[#111827]">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 max-w-md w-full shadow-xl relative overflow-hidden">
          {/* Top Decorative Bridge Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0A192F] via-[#00B4D8] to-[#0A192F]" />
          
          <div className="flex flex-col items-center justify-center mb-6 pt-2">
            <ViewBridgeLogo size="lg" theme="light" showTagline={true} className="mb-2" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A192F]/5 border border-[#0A192F]/10 text-xs font-bold text-[#0A192F] mt-2">
              <Lock className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>제한 테스트 참여자 전용 접근 잠금</span>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
            시범 운영 및 테스트 참여자를 위해 보호된 페이지입니다. 공유받으신 테스트 접속 비밀번호를 입력해 주세요.
          </p>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A192F] mb-1.5">
                테스트 접근 비밀번호
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] bg-[#F8F9FA] font-mono tracking-wider"
                autoFocus
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0A192F] hover:bg-[#00B4D8] text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>테스트 참여 접속하기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-600 leading-relaxed bg-[#F8F9FA] p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#00B4D8] shrink-0 mt-0.5" />
              <span>본 비밀번호는 회원 계정용이 아니라 제한 테스트 참여자 전용 접근 잠금장치입니다.</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-400 text-[10px]">
              <span>※ ViewBridge는 공개 전 시범 운영 중이며, 정식 릴리즈 시 보안 인증 및 계정 체계가 적용됩니다.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] font-sans antialiased selection:bg-[#00B4D8]/20 selection:text-[#0A192F]">
      {/* Brand Guide Modal */}
      <BrandGuideModal isOpen={isBrandGuideOpen} onClose={() => setIsBrandGuideOpen(false)} />

      {/* Header (ViewBridge Insight Navy Theme) */}
      <header className="bg-[#0A192F] text-white sticky top-0 z-40 shadow-md border-b border-[#0A192F]/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ViewBridgeLogo size="md" theme="dark" showTagline={true} />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Brand Story Button */}
            <button
              onClick={() => setIsBrandGuideOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#00B4D8] text-xs font-semibold text-white transition-all cursor-pointer border border-white/15"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00B4D8] hover:text-white" />
              <span className="hidden sm:inline">브랜드 철학 (Brand Guide)</span>
              <span className="sm:hidden">브랜드</span>
            </button>

            {/* Google Drive Auth Status */}
            {user ? (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-4 h-4 rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#00B4D8]" />
                )}
                <span className="max-w-[100px] truncate text-slate-200 hidden sm:inline">{user.displayName || user.email}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" title="구글 드라이브 연동됨" />
                <button
                  onClick={handleSignOut}
                  className="text-slate-300 hover:text-white ml-1"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 bg-[#00B4D8] hover:bg-[#00B4D8]/90 text-[#0A192F] font-bold px-3 py-1.5 rounded-full text-xs transition-all shadow-xs cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isLoggingIn ? "연결 중..." : "구글 드라이브 연결"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Greeting Banner (image.png Inspired) */}
      <section className="bg-gradient-to-b from-[#0A192F] via-[#0D2342] to-[#F8F9FA] text-white pt-6 pb-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00B4D8]/15 border border-[#00B4D8]/30 text-xs font-bold text-[#00B4D8] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Observation-driven Product Design</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              관찰이 만드는 인사이트, <span className="text-[#00B4D8]">연결이 만드는 가치</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              복잡한 금융 뉴스와 구글 드라이브 문서를 4단계 안전 구조(관찰·이해·연결·개선)로 명쾌하게 해설합니다.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto">
            <div className="p-2 bg-[#00B4D8]/20 rounded-xl text-[#00B4D8]">
              <Eye className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-300 block text-[10px]">인사이트 분석 기록</span>
              <span className="font-extrabold text-white">{history.length}건 완료</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 -mt-4 pb-16">
        
        {/* 🛡️ 메인 상단: 개인정보 및 비밀정보 보호 안내 배너 */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-xs mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100/90 rounded-xl text-amber-800 shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-extrabold text-amber-950 mb-1.5 flex items-center justify-between">
                <span>개인정보 및 비밀정보 보호 안내</span>
                <span className="text-[10px] font-extrabold bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                  필독 안내
                </span>
              </h3>
              <div className="text-[11.5px] text-amber-950/90 leading-relaxed font-medium space-y-1">
                <p>• 이 서비스는 금융 뉴스와 문서 이해를 돕는 참고용 도구입니다.</p>
                <p>• 주민등록번호, 계좌번호, 전화번호, 주소, 비밀번호, 내부자료, 미공개 정보, 계약서 원문 등 개인정보나 기밀정보는 입력하지 마세요.</p>
                <p>• 입력한 내용은 AI 분석을 위해 Gemini API로 전송될 수 있습니다.</p>
                <p>• 본 서비스는 투자 자문, 매수·매도 추천, 수익 보장을 제공하지 않습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills (image.png Inspired) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-[#0A192F] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#00B4D8]" />
              <span>카테고리별 체험 문서 (Categories)</span>
            </h3>
            <span className="text-[11px] text-slate-500">원클릭 즉시 불러오기</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["All", "IT/반도체", "주식/배당", "거시 경제", "원자재/에너지", "정부 정책"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#0A192F] text-white shadow-md shadow-[#0A192F]/20 flex items-center gap-1.5"
                    : "bg-white text-slate-600 border border-slate-200/90 hover:border-[#00B4D8] hover:text-[#0A192F]"
                }`}
              >
                {activeCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />}
                <span>{cat === "All" ? "전체 (All)" : cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Sample Article Cards Grid (image.png style card layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {filteredSamples.slice(0, 4).map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                setInputText(sample.content);
                setTab("direct");
                setIsComplianceChecked(true);
                setError(null);
                setChatMessages([]);
                if (sample.preloadedResult) {
                  setResult(sample.preloadedResult);
                } else {
                  handleAnalyzeDirectInput(sample.content);
                }
              }}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-[#00B4D8] transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00B4D8]/10 text-[#00B4D8]">
                    {sample.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{sample.category}</span>
                </div>
                <h4 className="text-xs font-bold text-[#0A192F] line-clamp-2 group-hover:text-[#00B4D8] transition-colors leading-snug mb-1.5">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {sample.content}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[120px]">{sample.source}</span>
                <span className="font-bold text-[#00B4D8] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  체험하기 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Main Layout: Left (Input/Drive/Upload) vs Right (Analysis Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column - 5/12 width */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Input Method Selector Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex gap-1 shadow-xs">
              <button
                onClick={() => setTab("direct")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === "direct"
                    ? "bg-[#0A192F] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0A192F] hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>직접 텍스트</span>
              </button>

              <button
                onClick={() => setTab("file")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === "file"
                    ? "bg-[#0A192F] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0A192F] hover:bg-slate-50"
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>파일 업로드</span>
              </button>

              <button
                onClick={() => setTab("drive")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === "drive"
                    ? "bg-[#0A192F] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0A192F] hover:bg-slate-50"
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>구글 드라이브</span>
              </button>
            </div>

            {/* TAB CONTENT: Direct Text Input */}
            {tab === "direct" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0A192F] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#00B4D8]" />
                    <span>금융 뉴스 또는 문서 내용 입력</span>
                  </span>
                  {inputText && (
                    <button
                      onClick={() => setInputText("")}
                      className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="분석하고 싶은 주식 뉴스, 공시 내용, 증권사 리포트, 금융 정책 본문을 여기에 붙여넣으세요..."
                  rows={8}
                  className="w-full p-3.5 bg-[#F8F9FA] border border-slate-200 rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-[#00B4D8] resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>글자 수: {inputText.length.toLocaleString()}자</span>
                  <span>권장: 50자 이상</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: File Upload */}
            {tab === "file" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00B4D8]/10 text-[#00B4D8] flex items-center justify-center mb-3">
                  <FileUp className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-[#0A192F] mb-1">문서 파일 직접 업로드</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                  TXT, Markdown 파일(.txt, .md)을 선택하시면 텍스트를 자동으로 추출하여 분석합니다.
                </p>

                <label className="px-5 py-2.5 bg-[#0A192F] hover:bg-[#00B4D8] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs">
                  <span>파일 선택하기</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {uploadedFileName && (
                  <p className="text-xs text-emerald-600 font-bold mt-3">
                    선택된 파일: {uploadedFileName}
                  </p>
                )}
              </div>
            )}

            {/* TAB CONTENT: Google Drive & Demo Files */}
            {tab === "drive" && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[#00B4D8]" />
                    <span>드라이브 문서 선택</span>
                  </h4>
                  {user && (
                    <button
                      onClick={() => token && fetchDriveFiles(token)}
                      className="text-[11px] text-[#00B4D8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      새로고침
                    </button>
                  )}
                </div>

                {/* Search Bar for Documents (image.png Inspired) */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="문서 제목 검색..."
                    className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-slate-200 rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  />
                </div>

                {/* Drive / Demo File List */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {/* Demo Files */}
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    즉시 체험용 데모 문서
                  </div>
                  {DEMO_DRIVE_FILES.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedFile?.id === file.id
                          ? "border-[#00B4D8] bg-[#00B4D8]/5 text-[#0A192F] font-bold"
                          : "border-slate-200/80 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {file.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{file.readTime}</span>
                      </div>
                      <p className="line-clamp-1">{file.name}</p>
                    </div>
                  ))}

                  {/* Real Google Drive Files (if logged in) */}
                  {user && (
                    <>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mt-3">
                        내 구글 드라이브 문서
                      </div>
                      {fetchingDrive ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          드라이브 목록을 불러오는 중...
                        </div>
                      ) : filteredDriveFiles.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">
                          지원되는 문서(구글문서, TXT)가 없습니다.
                        </div>
                      ) : (
                        filteredDriveFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              selectedFile?.id === file.id
                                ? "border-[#00B4D8] bg-[#00B4D8]/5 text-[#0A192F] font-bold"
                                : "border-slate-200/80 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <p className="line-clamp-1">{file.name}</p>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ACTION CARD & COMPLIANCE CHECKBOX */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3.5">
              {/* Compliance Checkbox */}
              <div className="bg-[#F8F9FA] border border-slate-200 rounded-xl p-3.5">
                <label htmlFor="compliance-check" className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="compliance-check"
                    checked={isComplianceChecked}
                    onChange={(e) => setIsComplianceChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#00B4D8] border-slate-300 rounded focus:ring-[#00B4D8] cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-bold text-[#0A192F] leading-snug">
                    개인정보·기밀정보를 입력하지 않았으며, 결과가 투자 자문이 아닌 참고용 정보임을 이해했습니다.
                  </span>
                </label>
              </div>

              {!isComplianceChecked && (
                <p className="text-[11px] text-amber-800 font-semibold text-center bg-amber-50 border border-amber-200/80 py-1.5 px-3 rounded-xl">
                  ⚠️ 필수: 위 개인정보·기밀정보 미입력 확인 동의 체크박스를 선택하셔야 분석 버튼이 활성화됩니다.
                </p>
              )}

              {/* Main Submit Action Button */}
              {tab === "drive" ? (
                <button
                  onClick={() => selectedFile && handleAnalyzeDriveFile(selectedFile)}
                  disabled={loading || !selectedFile || !isComplianceChecked}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loading || !selectedFile || !isComplianceChecked
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                      : "bg-[#0A192F] hover:bg-[#00B4D8] text-white shadow-md shadow-[#0A192F]/20 active:scale-98"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00B4D8]" />
                      <span>ViewBridge 인사이트 생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#00B4D8]" />
                      <span>선택된 드라이브 문서 분석 실행</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleAnalyzeDirectInput}
                  disabled={loading || !isComplianceChecked || !inputText.trim()}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loading || !isComplianceChecked || !inputText.trim()
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                      : "bg-[#0A192F] hover:bg-[#00B4D8] text-white shadow-md shadow-[#0A192F]/20 active:scale-98"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#00B4D8]" />
                      <span>ViewBridge 인사이트 생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#00B4D8]" />
                      <span>ViewBridge 인사이트 분석 시작</span>
                    </>
                  )}
                </button>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Analysis History Box */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#00B4D8]" />
                    <span>최근 분석 기록 ({history.length})</span>
                  </h4>
                  <button
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    전체 삭제
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        selectedHistoryId === item.id
                          ? "border-[#00B4D8] bg-[#00B4D8]/5 font-bold text-[#0A192F]"
                          : "border-slate-200/80 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex-1 truncate">
                        <p className="truncate text-xs">{item.title}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{item.date}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - 7/12 width (Analysis Results View) */}
          <div className="lg:col-span-7" ref={resultContainerRef}>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px]">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#00B4D8]/10 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-[#00B4D8]" />
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-[#0A192F] mb-2">
                  ViewBridge가 문서를 관찰하고 해석하는 중입니다
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed animate-fade-in">
                  {loadingTips[loadingTipIndex]}
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                
                {/* Result Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#0A192F] text-white">
                        ViewBridge 인사이트 리포트
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date().toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    {/* Font Scale & Export Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLargeFont(!isLargeFont)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors cursor-pointer"
                        title="글자 크기 조절"
                      >
                        {isLargeFont ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleCopyReport}
                        className="px-3 py-1.5 rounded-xl bg-[#0A192F] hover:bg-[#00B4D8] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copySuccess ? "복사완료!" : "리포트 복사"}</span>
                      </button>
                      <button
                        onClick={handleDownloadTxt}
                        className="px-3 py-1.5 rounded-xl bg-[#00B4D8] hover:bg-[#00B4D8]/90 text-[#0A192F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>TXT 다운로드</span>
                      </button>
                    </div>
                  </div>

                  <h2 className={`font-extrabold text-[#0A192F] mb-3 leading-snug ${isLargeFont ? "text-xl" : "text-lg"}`}>
                    {result.title}
                  </h2>

                  {/* 3-Second Summary Box */}
                  <div className="p-4 bg-[#0A192F]/5 border border-[#0A192F]/10 rounded-2xl mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00B4D8] block mb-1">
                      ⚡ 3초 핵심 요약
                    </span>
                    <p className={`font-semibold text-[#0A192F] leading-relaxed ${isLargeFont ? "text-sm" : "text-xs"}`}>
                      {result.summary3Sec}
                    </p>
                  </div>

                  {/* Impact and Direction Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Signal Box */}
                    <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        AI 해석 방향
                      </span>
                      <div className="flex items-center gap-2">
                        {result.sentiment === "bullish" ? (
                          <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        ) : result.sentiment === "bearish" ? (
                          <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                            <TrendingDown className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                            <Minus className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#0A192F]">
                          {result.sentiment === "bullish"
                            ? "긍정적으로 해석될 수 있는 배경이 일부 확인됨"
                            : result.sentiment === "bearish"
                            ? "유의 요인이 일부 확인됨"
                            : "중립 요인 및 관련 영향 관망"}
                        </span>
                      </div>
                    </div>

                    {/* Impact Gauge */}
                    <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        참고용 영향 범위
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-2.5 flex-1 rounded-full ${
                              lvl <= result.impactScore
                                ? "bg-[#00B4D8]"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                        <span className="text-xs font-extrabold text-[#0A192F] ml-1.5">
                          {result.impactScore}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. [공신력 검증] 🛡️ 공신력 자료 바탕 출처 및 신뢰성 정밀 진단 */}
                <div className="bg-blue-50/50 border border-blue-100/90 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0A192F] flex items-center gap-2">
                        <span>공신력 자료 바탕 출처 및 신뢰성 정밀 진단</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        인공지능이 뉴스/보고서의 신뢰성과 유관기관 공식 통계 자료를 교차 검증한 결과입니다.
                      </p>
                    </div>
                  </div>

                  {/* 서브섹션 1: 출처 및 정보 공신력 평가 */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>출처 및 정보 공신력 평가</span>
                    </h4>
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed shadow-2xs">
                      {result.sourceCredibility || "이 기사는 공식 보도 및 주요 기업 발표를 바탕으로 작성되어 기본적인 공신력을 갖추고 있습니다."}
                    </div>
                  </div>

                  {/* 서브섹션 2: 교차 검증을 위한 공신력 참고 지표 및 공식 채널 */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>교차 검증을 위한 공신력 참고 지표 및 공식 채널</span>
                    </h4>
                    <div className="space-y-2">
                      {result.authoritativeContext && result.authoritativeContext.length > 0 ? (
                        result.authoritativeContext.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-2xs">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-500">
                          금융감독원 전자공시시스템(DART), 한국거래소(KRX) 등 공식 채널을 통한 교차 검증을 권장합니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. [실시간 교차 검증] 🌐 실시간 추가 금융 소식 및 교차 검증 뉴스 [GOOGLE SEARCH LIVE] */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-extrabold text-[#0A192F]">
                            실시간 추가 금융 소식 및 교차 검증 뉴스
                          </h3>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                            GOOGLE SEARCH LIVE
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          구글 검색 엔진의 실시간 결과를 반영하여, 분석 기사와 가장 밀접한 핵심 뉴스 및 공시 자료를 찾아 연동한 결과입니다.
                        </p>
                      </div>
                    </div>

                    {/* 정렬 토글 */}
                    {result.relatedNews && result.relatedNews.length > 0 && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px]">
                        <button
                          onClick={() => setNewsSortOrder("relevance")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            newsSortOrder === "relevance"
                              ? "bg-white text-[#0A192F] shadow-2xs"
                              : "text-slate-500 hover:text-[#0A192F]"
                          }`}
                        >
                          관련도순
                        </button>
                        <button
                          onClick={() => setNewsSortOrder("latest")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            newsSortOrder === "latest"
                              ? "bg-white text-[#0A192F] shadow-2xs"
                              : "text-slate-500 hover:text-[#0A192F]"
                          }`}
                        >
                          최신순
                        </button>
                      </div>
                    )}
                  </div>

                  {result.relatedNews && result.relatedNews.length > 0 ? (
                    <div className="space-y-3">
                      {getSortedNews().map((news, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200/90 bg-[#F8F9FA] hover:bg-white hover:border-[#00B4D8] transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h4 className="text-xs font-bold text-[#0A192F] leading-snug line-clamp-1">
                              {news.title}
                            </h4>
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-[#00B4D8] shrink-0"
                              title="원문 기사 열기"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                            {news.snippet}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/50">
                            <span className="font-semibold text-slate-600">{news.source}</span>
                            <span>{news.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-medium">
                        분석된 주제와 부합하는 추가 실시간 관련 뉴스를 구글 검색에서 조회 중이거나, 검색 결과가 존재하지 않습니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. [2열 그리드] 주린이 맞춤형 경제 용어 사전 & 영향을 받는 테마 및 연관 업종 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 좌측: 주린이 맞춤형 경제 용어 사전 [AI 쉬운 번역] */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-extrabold text-[#0A192F]">
                            주린이 맞춤형 경제 용어 사전
                          </h3>
                        </div>
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                          AI 쉬운 번역
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {(result.glossary || result.terms) && (result.glossary || result.terms)!.length > 0 ? (
                          (result.glossary || result.terms)!.map((term, i) => (
                            <div key={i} className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80 text-xs">
                              <div className="font-extrabold text-[#0A192F] mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span>{term.term}</span>
                              </div>
                              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                {term.definition || term.meaning}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">문서에서 추출된 별도 난해한 용어가 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 영향을 받는 테마 및 연관 업종 [객관적 인과관계] */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-extrabold text-[#0A192F]">
                            영향을 받는 테마 및 연관 업종
                          </h3>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                          객관적 인과관계
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {result.affectedSectors && result.affectedSectors.length > 0 ? (
                          result.affectedSectors.map((sector, i) => (
                            <div key={i} className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-extrabold text-[#0A192F]">{sector.sector}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  sector.direction === "up"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {sector.direction === "up" ? "📈 수혜 예측" : "📉 유의 영향"}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                                {sector.reason}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">특정 테마에 대한 직접적인 영향 인과관계가 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. [팩트 분석] ✅ 뉴스 핵심 팩트 분석 & 인사이트 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-[#0A192F]">
                      뉴스 핵심 팩트 분석 & 인사이트
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {result.verifiedFacts && result.verifiedFacts.length > 0 ? (
                      result.verifiedFacts.map((fact, idx) => (
                        <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs flex items-start gap-3 shadow-2xs hover:border-slate-300 transition-colors">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-[#0A192F] leading-relaxed mb-1">
                              {fact.fact}
                            </p>
                            {fact.quote && (
                              <p className="text-[11px] text-slate-500 bg-[#F8F9FA] p-2 rounded-lg border border-slate-100 italic leading-relaxed">
                                "{fact.quote}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">원문에서 확인된 명시적 사실이 제공되지 않았습니다.</p>
                    )}
                  </div>
                </div>

                {/* 5. [AI 입체 심층 해석] 💡 AI 입체 심층 해석 및 시장 영향 (Stage 02. Understand) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-[#0A192F]">
                          AI 입체 심층 해석 및 시장 영향 (Stage 02. Understand)
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          단순 사실을 넘어, 이것이 주식 시장과 산업에 미치는 시사점과 맥락을 AI가 입체적으로 분석합니다.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 font-bold text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                      가설·해석 기반
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(result.aiInterpretations || result.aiInterpretation) && (result.aiInterpretations || result.aiInterpretation)!.length > 0 ? (
                      (result.aiInterpretations || result.aiInterpretation)!.map((inter, idx) => (
                        <div key={idx} className="p-3.5 bg-[#F8F9FA] rounded-xl border border-slate-200/80 text-xs shadow-2xs hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-[#0A192F] flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              {inter.topic || "핵심 시사점"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              inter.sentiment === "bullish"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                                : inter.sentiment === "bearish"
                                ? "bg-rose-100 text-rose-800 border border-rose-300/60"
                                : "bg-amber-100 text-amber-800 border border-amber-300/60"
                            }`}>
                              {inter.sentiment === "bullish" ? "📈 긍정 배경" : inter.sentiment === "bearish" ? "📉 유의 요인" : "⚖️ 중립 관망"}
                            </span>
                          </div>
                          <p className="font-medium text-slate-700 leading-relaxed">
                            {inter.interpretation}
                          </p>
                          {inter.reasoning && (
                            <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
                              <span className="text-[#00B4D8] font-bold shrink-0">↳</span>
                              <span><strong className="text-slate-600">분석 맥락:</strong> {inter.reasoning}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">도출된 AI 입체 해석 항목이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 6. [공시 교차 검증] 🔍 DART 전자공시 & 공식 IR 추가 확인 필요 사항 (Stage 03. Connect) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-[#0077B6] flex items-center justify-center shrink-0">
                        <FileSearch className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-[#0A192F]">
                          DART 전자공시 & 공식 IR 추가 확인 필요 사항 (Stage 03. Connect)
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          기사 원문만으로 확인이 부족하여 투자 전 공식 공시나 타사 보도를 통해 반드시 교차 검증해야 할 핵심 항목입니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3.5">
                    {result.needFurtherVerification && result.needFurtherVerification.length > 0 ? (
                      result.needFurtherVerification.map((item, idx) => (
                        <div key={idx} className="p-3 bg-sky-50/40 rounded-xl border border-sky-200/60 text-xs text-slate-800 leading-relaxed flex items-start gap-2.5">
                          <span className="w-4 h-4 rounded-md bg-[#0077B6] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{item}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">공식 공시에서 추가로 확인할 특이 사항이 없습니다.</p>
                    )}
                  </div>

                  {/* 공식 검증 바로가기 버튼 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href="https://dart.fss.or.kr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#00B4D8] hover:text-[#0077B6] text-slate-600 text-[11px] font-semibold transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#00B4D8]" />
                      <span>DART 전자공시 바로가기</span>
                    </a>
                    <a
                      href="https://data.krx.co.kr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#00B4D8] hover:text-[#0077B6] text-slate-600 text-[11px] font-semibold transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#00B4D8]" />
                      <span>KRX 정보데이터시스템</span>
                    </a>
                  </div>
                </div>

                {/* 7. [투자 리스크 및 오해 방지] ⚠️ 이면의 구조적 리스크 & 초보자가 빠지기 쉬운 오해와 진실 (Stage 04. Improve) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 좌측: 구조적 리스크 */}
                  <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <h3 className="text-xs font-extrabold text-amber-950">
                          ⚠️ 이면의 구조적 리스크 및 유의점
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {(result.riskFactors || result.risks) && (result.riskFactors || result.risks)!.length > 0 ? (
                          (result.riskFactors || result.risks)!.map((risk, i) => (
                            <div key={i} className="p-3 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-slate-800 leading-relaxed shadow-2xs">
                              {risk}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-white/90 rounded-xl border border-amber-200/70 text-xs text-slate-800 leading-relaxed">
                            {result.beginnerCaution || "무리한 추종이나 단편적 해석을 지양하고 DART 공시를 교차 검증하세요."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 초보자가 빠지기 쉬운 오해와 진실 */}
                  <div className="bg-rose-50/40 border border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <h3 className="text-xs font-extrabold text-rose-950">
                          💡 초보 투자자가 빠지기 쉬운 오해와 진실
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {result.misconceptions && result.misconceptions.length > 0 ? (
                          result.misconceptions.map((item, i) => (
                            <div key={i} className="p-3 bg-white/90 rounded-xl border border-rose-200/70 text-xs text-slate-800 leading-relaxed shadow-2xs">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-white/90 rounded-xl border border-rose-200/70 text-xs text-slate-800 leading-relaxed">
                            기사 제목이나 단편적 호재만 보고 즉각적인 급등을 확신하는 섣부른 판단을 주의하세요.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. [행동 지침] ✨ 초보자 당장 대응 및 실천 리스크 지침 (Action Plan) */}
                <div className="bg-[#0A192F] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
                  <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-white/10">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h3 className="text-xs font-extrabold text-white">
                      초보자 당장 대응 및 실천 리스크 지침 (Action Plan)
                    </h3>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {(result.actionPlan || result.beginnerChecklist) && (result.actionPlan || result.beginnerChecklist)!.length > 0 ? (
                      (result.actionPlan || result.beginnerChecklist)!.map((action, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 text-xs text-slate-100 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{action}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300">
                        관련 기업의 DART 분기보고서와 부채비율을 사전에 확인하세요.
                      </div>
                    )}
                  </div>

                  {/* 하단 친절 팁 박스 */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10 text-[11px] text-slate-400">
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>투자 전, 기사에 나온 관련 상장 기업들의 부채 비율도 함께 확인해 보시면 안전합니다.</span>
                  </div>
                </div>


                {/* Interactive Q&A Assistant */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-[#0A192F] mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#00B4D8]" />
                    <span>ViewBridge Q&A 어시스턴트</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-3">
                    이 기사나 문서 내용 중 더 이해하기 어렵거나 궁금한 점을 질문해 보세요.
                  </p>

                  {/* Chat message bubbles */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 bg-[#F8F9FA] rounded-xl border border-slate-200 mb-3 text-xs">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[9px] text-slate-400 mb-0.5">
                            {msg.role === "user" ? "나의 질문" : "ViewBridge 답변"}
                          </span>
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-[#0A192F] text-white rounded-tr-xs"
                                : "bg-white text-[#111827] border border-slate-200 rounded-tl-xs shadow-2xs"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00B4D8]" />
                          <span>답변을 생성하고 있습니다...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="예: HBM4가 상용화되면 관련 장비주에는 어떤 영향이 있나요?"
                      className="flex-1 px-3.5 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || chatLoading}
                      className="px-4 py-2.5 bg-[#0A192F] hover:bg-[#00B4D8] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>전송</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-16 h-16 rounded-2xl bg-[#0A192F]/5 text-[#0A192F] flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-[#00B4D8]" />
                </div>
                <h3 className="text-base font-extrabold text-[#0A192F] mb-1.5">
                  분석할 문서를 입력하거나 상단 추천 문서를 선택하세요
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  좌측 입력창에 텍스트를 붙여넣거나 상단 카테고리 칩에서 원하는 데모 문서를 1초 만에 불러와 인사이트를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer (ViewBridge Brand Footprint) */}
      <footer className="bg-[#0A192F] text-white mt-16 py-12 border-t border-[#0A192F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <ViewBridgeLogo size="md" theme="dark" showTagline={true} className="mb-2 justify-center md:justify-start" />
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
              관찰이 만드는 인사이트, 연결이 만드는 가치. 초보 투자자의 건전한 정보 습득을 위한 AI 뉴스 및 문서 해설 도구.
            </p>
          </div>

          {/* Core Brand Principles Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">01. Observe First</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">02. Solve Problems</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">03. Data Before Opinion</span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">04. Continuous Improvement</span>
          </div>
        </div>

        {/* Legal / Protection Notice */}
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-[11px] text-slate-400 space-y-1 text-center">
          <p>이 서비스는 금융 뉴스와 문서 이해를 돕는 참고용 도구이며, 투자 자문이나 매수·매도 추천을 제공하지 않습니다.</p>
          <p>개인정보, 기밀정보, 계좌정보는 절대 입력하지 마세요. © 2026 ViewBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
