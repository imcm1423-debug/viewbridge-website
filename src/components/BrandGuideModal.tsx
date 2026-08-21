import React from "react";
import { ViewBridgeLogo } from "./ViewBridgeLogo";
import { Eye, Lightbulb, Link2, TrendingUp, Shield, CheckCircle2, X, Sparkles, BookOpen } from "lucide-react";

interface BrandGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandGuideModal: React.FC<BrandGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#111827] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0A192F] p-6 text-white rounded-t-3xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <ViewBridgeLogo size="xl" theme="dark" showTagline={false} />
          </div>
          
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <ViewBridgeLogo size="lg" theme="dark" showTagline={true} className="mb-3" />
          <p className="text-sm text-[#00B4D8] font-semibold mt-1">
            관찰이 만드는 인사이트, 연결이 만드는 가치
          </p>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            ViewBridge는 정보 과부하와 불확실성 속에서 금융 뉴스와 문서의 본질을 관찰하고, 초보 투자자가 올바른 판단을 내릴 수 있도록 신뢰할 수 있는 해석을 연결합니다.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* 01. Brand Philosophy - 4 Steps */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00B4D8] mb-3">
              01. Brand Philosophy
            </h4>
            <div className="text-sm font-extrabold text-[#0A192F] mb-3">
              Good design begins with observation.
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80 text-center flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-[#0A192F]/5 text-[#0A192F] flex items-center justify-center mb-2">
                  <Eye className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <span className="text-xs font-bold text-[#0A192F]">Observe</span>
                <span className="text-[11px] text-slate-500 mt-0.5">관찰한다</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80 text-center flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-[#0A192F]/5 text-[#0A192F] flex items-center justify-center mb-2">
                  <Lightbulb className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <span className="text-xs font-bold text-[#0A192F]">Understand</span>
                <span className="text-[11px] text-slate-500 mt-0.5">이해한다</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80 text-center flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-[#0A192F]/5 text-[#0A192F] flex items-center justify-center mb-2">
                  <Link2 className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <span className="text-xs font-bold text-[#0A192F]">Connect</span>
                <span className="text-[11px] text-slate-500 mt-0.5">연결한다</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-slate-200/80 text-center flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-[#0A192F]/5 text-[#0A192F] flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-[#00B4D8]" />
                </div>
                <span className="text-xs font-bold text-[#0A192F]">Improve</span>
                <span className="text-[11px] text-slate-500 mt-0.5">개선한다</span>
              </div>
            </div>
          </div>

          {/* 02. Color System */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00B4D8] mb-3">
              02. Color System
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#0A192F] text-white p-3.5 rounded-2xl shadow-xs">
                <div className="text-[10px] font-mono opacity-75">#0A192F</div>
                <div className="font-extrabold text-xs mt-1">Insight Navy</div>
                <div className="text-[10px] text-slate-300 mt-0.5">깊이 있는 관찰과 사고</div>
              </div>

              <div className="bg-[#00B4D8] text-white p-3.5 rounded-2xl shadow-xs">
                <div className="text-[10px] font-mono opacity-75">#00B4D8</div>
                <div className="font-extrabold text-xs mt-1">Bridge Mint</div>
                <div className="text-[10px] text-white/90 mt-0.5">연결과 가능성</div>
              </div>

              <div className="bg-[#F8F9FA] border border-slate-300 text-[#111827] p-3.5 rounded-2xl shadow-xs">
                <div className="text-[10px] font-mono text-slate-500">#F8F9FA</div>
                <div className="font-extrabold text-xs mt-1">Soft White</div>
                <div className="text-[10px] text-slate-600 mt-0.5">명확함과 집중</div>
              </div>

              <div className="bg-[#111827] text-white p-3.5 rounded-2xl shadow-xs">
                <div className="text-[10px] font-mono opacity-75">#111827</div>
                <div className="font-extrabold text-xs mt-1">Deep Gray</div>
                <div className="text-[10px] text-slate-300 mt-0.5">가독성과 신뢰</div>
              </div>
            </div>
          </div>

          {/* 03. Design Principles */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00B4D8] mb-3">
              03. Design Principles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80">
                <span className="font-extrabold text-[#0A192F] block mb-0.5">🔍 Observe First</span>
                <span className="text-slate-600 text-[11px]">사실을 먼저 관찰하고, 현상을 있는 그대로 본다.</span>
              </div>

              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80">
                <span className="font-extrabold text-[#0A192F] block mb-0.5">🎯 Solve Problems</span>
                <span className="text-slate-600 text-[11px]">사용자와 투자자의 진짜 문제를 해결한다.</span>
              </div>

              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80">
                <span className="font-extrabold text-[#0A192F] block mb-0.5">📊 Data Before Opinion</span>
                <span className="text-slate-600 text-[11px]">데이터와 원문 근거를 기반으로 신중히 분석한다.</span>
              </div>

              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-slate-200/80">
                <span className="font-extrabold text-[#0A192F] block mb-0.5">🔄 Continuous Improvement</span>
                <span className="text-slate-600 text-[11px]">지속적으로 검증하고 작게 개선해 나간다.</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#0A192F] hover:bg-[#00B4D8] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
