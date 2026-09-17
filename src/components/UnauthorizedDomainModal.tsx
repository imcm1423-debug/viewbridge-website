import React, { useState } from "react";
import { ShieldAlert, Copy, Check, ExternalLink, X, HardDrive, FileText, ArrowRight } from "lucide-react";

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  projectId?: string;
  onUseDemo: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain,
  projectId = "oceanic-alignment-kxhgq",
  onUseDemo,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentHost = domain || window.location.hostname;
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto text-[#111827] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0A192F] p-5 text-white rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-400 mb-1.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide">Firebase 보안 설정 안내</span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            구글 로그인 승인 도메인(Authorized Domain) 설정
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Firebase Auth의 보안 정책상, 현재 실행 중인 도메인이 프로젝트 승인 목록에 등록되어 있어야 구글 로그인이 정상 작동합니다.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current Domain Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>현재 접속 도메인 (Host)</span>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                미등록 상태
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <code className="text-xs font-mono text-[#0A192F] font-bold truncate select-all">
                {currentHost}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0A192F] hover:bg-[#00B4D8] text-white text-[11px] font-semibold shrink-0 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사 완료</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>도메인 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick 3-Step Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
              <span>간단 1분 해결 방법</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00B4D8] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="flex-1 leading-relaxed">
                  위 <strong className="text-[#0A192F]">[도메인 복사]</strong> 버튼을 누릅니다.
                </span>
              </div>
              <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00B4D8] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="flex-1 leading-relaxed">
                  <strong className="text-[#0A192F]">Firebase 콘솔</strong>의 [Authentication] → [설정(Settings)] → [승인된 도메인(Authorized domains)]으로 이동합니다.
                </span>
              </div>
              <div className="p-2.5 bg-[#F8F9FA] rounded-xl border border-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#00B4D8] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="flex-1 leading-relaxed">
                  <strong className="text-[#0A192F]">[도메인 추가]</strong>를 클릭하고 복사한 도메인을 붙여넣은 뒤 저장합니다.
                </span>
              </div>
            </div>

            <a
              href={consoleSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-[#00B4D8] hover:text-[#0077B6] text-slate-700 text-xs font-bold transition-all shadow-2xs mt-1"
            >
              <span>Firebase 콘솔 설정 페이지 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#00B4D8]" />
            </a>
          </div>

          {/* Instant Demo Alternative Box */}
          <div className="pt-3 border-t border-slate-200/80">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-emerald-950">설정 없이 바로 사용해보기</span>
              </div>
              <p className="text-[11.5px] text-emerald-900 leading-relaxed">
                도메인 등록 없이도 <strong>체험용 구글 드라이브 문서</strong>와 <strong>직접 텍스트 붙여넣기/파일 업로드</strong>를 통해 모든 ViewBridge 분석 기능을 즉시 100% 체험하실 수 있습니다.
              </p>
              <button
                onClick={() => {
                  onUseDemo();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>체험용 구글 드라이브 문서로 즉시 시작하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 rounded-b-3xl border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
