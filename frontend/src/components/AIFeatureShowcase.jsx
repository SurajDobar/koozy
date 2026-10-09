import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Upload,
  Download,
  Copy,
  Check,
  CheckCircle2,
  FileCode,
  Clock
} from 'lucide-react';
import { playSfx } from '../utils/sfx';

export default function AIFeatureShowcase() {
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [importTab, setImportTab] = useState('file'); // 'file' | 'paste'
  const [exported, setExported] = useState(false);

  const handleCopyTemplate = () => {
    playSfx('url');
    setCopiedTemplate(true);
    const samplePrompt = `Create a 5-question multiple choice quiz on [TOPIC].
Format strictly as JSON array with schema:
[{"question": "Stem?", "options": ["A", "B", "C", "D"], "correct_answer": "A"}]`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(samplePrompt).catch(() => {});
    }
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleExportSim = () => {
    playSfx('button');
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const features = [
    {
      letter: 'A',
      num: '01',
      tag: 'AI GENERATION',
      title: 'Generate Quizzes with Gemini AI',
      desc: 'Type any topic or curriculum unit. Built-in Google Gemini AI drafts 4-choice questions with plausible distractors in 5 seconds.',
      benefit: 'Eliminate manual drafting — get instant structured MCQs ready to customize.',
      ctaText: 'Generate Quiz with AI',
      ctaLink: '/host/quizzes/create/',
      ctaClass: 'kz-btn-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] shrink-0 inline-flex cursor-pointer',
      theme: {
        bg: '#e6f9ff',
        border: '#05cdff',
        text: '#034a6e',
        badgeBg: '#05cdff',
      },
      renderVisual: () => (
        <FeatureAVisual
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
        />
      ),
    },
    {
      letter: 'B',
      num: '02',
      tag: 'MODEL FREEDOM',
      title: 'Bring Your Own AI Questions',
      desc: 'Prefer ChatGPT, Claude, or DeepSeek? Copy our prompt template, generate with any LLM, and paste the questions right in.',
      benefit: 'Zero model lock-in — feed private lecture slides or specialized textbooks.',
      ctaText: 'Get Prompt Template',
      ctaLink: '/host/quizzes/create/',
      ctaClass: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-black bg-white border-2 border-[#191817] text-[#191817] shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] hover:bg-[#ffebe8] transition-colors flex items-center gap-1.5 shrink-0 inline-flex cursor-pointer',
      theme: {
        bg: '#ffebe8',
        border: '#ff0000',
        text: '#990000',
        badgeBg: '#ff0000',
      },
      renderVisual: () => (
        <FeatureBVisual
          copied={copiedTemplate}
          onCopy={handleCopyTemplate}
        />
      ),
    },
    {
      letter: 'C',
      num: '03',
      tag: 'INSTANT IMPORT',
      title: 'One-Click Quiz JSON Import',
      desc: 'Already have questions in spreadsheets or LMS archives? Upload a .json file or paste raw JSON to build a live quiz instantly.',
      benefit: 'Effortless content migration — load full question banks in one second.',
      ctaText: 'Import Quiz JSON',
      ctaLink: '/host/quizzes/',
      ctaClass: 'kz-btn-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-black flex items-center gap-1.5 shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] shrink-0 inline-flex cursor-pointer',
      theme: {
        bg: '#e6ffe6',
        border: '#00cc05',
        text: '#08660a',
        badgeBg: '#00cc05',
      },
      renderVisual: () => (
        <FeatureCVisual
          activeTab={importTab}
          setActiveTab={setImportTab}
        />
      ),
    },
    {
      letter: 'D',
      num: '04',
      tag: 'DATA OWNERSHIP',
      title: 'Universal Quiz JSON Export',
      desc: 'Download any quiz as a structured JSON file with one click. Save offline backups, share with colleagues, or reload anytime.',
      benefit: '100% data portability — your quizzes belong to you, without lock-in.',
      ctaText: 'View Quiz Studio',
      ctaLink: '/host/quizzes/',
      ctaClass: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-black bg-white border-2 border-[#191817] text-[#191817] shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] hover:bg-[#eeeafd] transition-colors flex items-center gap-1.5 shrink-0 inline-flex cursor-pointer',
      theme: {
        bg: '#f3eaff',
        border: '#8000ff',
        text: '#4a0099',
        badgeBg: '#8000ff',
      },
      renderVisual: () => (
        <FeatureDVisual
          exported={exported}
          onExport={handleExportSim}
        />
      ),
    },
  ];

  return (
    <section id="ai-features" className="py-8 sm:py-12 md:py-16 border-t border-[#d8d3ca] relative">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto px-4 text-center mb-6 sm:mb-10 md:mb-12">
        <div className="font-hand text-xl sm:text-2xl text-[#6c4de8] -rotate-2 select-none mb-1">
          complete creator toolkit ✦
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#191817] tracking-tight">
          Everything You Need to Build Quizzes Fast
        </h2>
        <p className="text-xs sm:text-base text-[#77736c] font-medium mt-1.5 sm:mt-2 max-w-xl mx-auto">
          From 5-second AI generation to flexible JSON imports and exports—explore the four core creator features.
        </p>
      </div>

      {/* Cascading Stacking Feature Cards */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 relative pb-10 sm:pb-16">
        {features.map((feature, idx) => {
          const topStickyOffsetDesktop = 85 + idx * 18;
          const topStickyOffsetMobile = 58 + idx * 6;

          return (
            <div
              key={feature.letter}
              className="sticky mb-5 sm:mb-8 md:mb-10 transition-all duration-300"
              style={{
                top: `var(--feature-top-${idx})`,
                zIndex: 10 + idx,
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                :root {
                  --feature-top-${idx}: ${topStickyOffsetMobile}px;
                }
                @media (min-width: 640px) {
                  :root {
                    --feature-top-${idx}: ${topStickyOffsetDesktop}px;
                  }
                }
              `,
                }}
              />
              <div
                className="p-3 sm:p-5 md:p-7 border-2 border-[#191817] shadow-[3px_3px_0_#191817] sm:shadow-[5px_5px_0_#191817] rounded-xl sm:rounded-3xl transition-transform max-h-[82vh] sm:max-h-none overflow-y-auto"
                style={{
                  backgroundColor: feature.theme.bg,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-5 md:gap-7 items-center">
                  {/* Left Column (5 cols) */}
                  <div className="md:col-span-5 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2.5">
                      <div
                        className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl text-white flex items-center justify-center font-mono font-black text-xs sm:text-lg border-2 border-[#191817] shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817] shrink-0"
                        style={{ backgroundColor: feature.theme.badgeBg }}
                      >
                        {feature.letter}
                      </div>

                      <span className="font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2 rounded-md bg-white border border-[#191817] text-[#191817]">
                        {feature.tag} · {feature.num}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-2xl md:text-3xl font-black text-[#191817] tracking-tight leading-tight mb-0.5 sm:mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-[#191817]/85 font-medium leading-snug mb-1.5 sm:mb-3">
                      {feature.desc}
                    </p>

                    {/* Benefit Callout */}
                    <div className="bg-white/85 border border-[#191817] rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 mb-2 sm:mb-4 shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817]">
                      <span className="font-mono font-black text-[#6c4de8] uppercase tracking-wider text-[9px] sm:text-[10px] block leading-none mb-0.5">
                        ✦ Clear Benefit:
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-[#191817] leading-tight block">
                        {feature.benefit}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <div>
                      <a
                        href={feature.ctaLink}
                        onClick={() => playSfx('button')}
                        className={feature.ctaClass}
                      >
                        <span>{feature.ctaText}</span>
                        <span>&rarr;</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column (7 cols): Mini UI Mockup */}
                  <div className="md:col-span-7">
                    <div className="bg-white p-2 sm:p-3.5 md:p-4 rounded-lg sm:rounded-2xl border-2 border-[#191817] shadow-[2px_2px_0_#191817] sm:shadow-[3px_3px_0_#191817]">
                      {feature.renderVisual()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================================
   FEATURE VISUAL MOCKUPS (Accurately reflecting Koozy codebase UI)
   ========================================================================= */

function FeatureAVisual({ questionCount, setQuestionCount }) {
  return (
    <div className="bg-[#fffdf7] border-2 border-[#191817] rounded-lg sm:rounded-2xl overflow-hidden shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] text-left">
      {/* Header */}
      <div className="bg-[#f7f5ef] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b-2 border-[#191817] flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#6c4de8] text-white flex items-center justify-center border border-[#191817] text-[10px] sm:text-xs">
            ✦
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-black text-[#191817] leading-none">
              Gemini AI Generator
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#77736c] font-semibold mt-0.5 hidden sm:block">
              Strict 4-Choice MCQ Schema
            </div>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#946200] bg-[#fff8e7] px-1.5 py-0.5 sm:px-2 rounded-full border border-[#ffbd2e]">
          Quota: 8 / 8 left
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#191817] bg-white text-[10px] sm:text-xs font-bold">
        <div className="flex-1 py-1 sm:py-1.5 text-center bg-[#eeeafd] text-[#6c4de8] border-r-2 border-[#191817]">
          ✨ Gemini Generator
        </div>
        <div className="flex-1 py-1 sm:py-1.5 text-center text-[#77736c]">
          📋 Copy Prompt Template
        </div>
      </div>

      {/* Body */}
      <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-3">
        <div>
          <span className="block text-[9px] sm:text-[10px] font-bold text-[#191817] uppercase mb-0.5 sm:mb-1">
            Topic or Instructions
          </span>
          <div className="bg-white border-2 border-[#191817] rounded-md sm:rounded-xl p-1.5 sm:p-2 text-[11px] sm:text-xs font-semibold text-[#191817] truncate">
            Photosynthesis, Cellular Respiration & ATP Cycle
          </div>
        </div>

        {/* Count Selector */}
        <div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-[#77736c] uppercase mb-0.5 sm:mb-1">
            <span>Question Count:</span>
            <span className="font-mono text-[#6c4de8]">{questionCount} Qs</span>
          </div>
          <div className="flex gap-1 sm:gap-1.5">
            {[3, 5, 10, 15].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => {
                  playSfx('button');
                  setQuestionCount(cnt);
                }}
                className={`flex-1 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border-2 border-[#191817] transition-all cursor-pointer ${
                  questionCount === cnt
                    ? 'bg-[#6c4de8] text-white shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817]'
                    : 'bg-white text-[#191817] hover:bg-[#eeeafd]'
                }`}
              >
                {cnt} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Progress simulation bar */}
        <div className="bg-[#f0ecfc] border border-[#191817] rounded-md sm:rounded-xl p-1 sm:p-2 text-[10px] sm:text-[11px] font-semibold text-[#191817] flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[#6c4de8]">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">Distractor balancing & schema validation</span>
          </div>
          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#00cc05] shrink-0">100% Valid</span>
        </div>

        <button
          type="button"
          onClick={() => playSfx('button')}
          className="kz-btn-primary w-full py-1.5 sm:py-2 rounded-md sm:rounded-xl text-[11px] sm:text-xs font-black shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ffbd2e]" />
          <span>Generate Quiz ({questionCount} Questions) &rarr;</span>
        </button>
      </div>
    </div>
  );
}

function FeatureBVisual({ copied, onCopy }) {
  return (
    <div className="bg-[#fffdf7] border-2 border-[#191817] rounded-lg sm:rounded-2xl overflow-hidden shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] text-left">
      {/* Header */}
      <div className="bg-[#f7f5ef] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b-2 border-[#191817] flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#ff0000] text-white flex items-center justify-center border border-[#191817] text-xs">
            <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-black text-[#191817] leading-none">
              External LLM Prompt Template
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#77736c] font-semibold mt-0.5 hidden sm:block">
              Compatible with ChatGPT, Claude, DeepSeek
            </div>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#990000] bg-[#ffebe8] px-1.5 py-0.5 sm:px-2 rounded-full border border-[#ff0000]/40">
          JSON Schema
        </span>
      </div>

      {/* Body */}
      <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-2.5">
        <div className="text-[10px] sm:text-xs text-[#77736c] leading-tight">
          Copy this template into ChatGPT, paste your notes, and import the returned JSON directly into Koozy:
        </div>

        {/* Code Block */}
        <div className="relative bg-[#191817] text-[#00ff66] font-mono text-[9px] sm:text-[11px] p-2 sm:p-3 rounded-md sm:rounded-xl border-2 border-[#191817] overflow-x-auto max-h-20 sm:max-h-28">
          <pre className="leading-tight select-all">
{`[
  {
    "question": "Which molecule carries chemical energy in cells?",
    "options": ["ATP", "Glucose", "DNA", "Lipid"],
    "correct_answer": "A"
  }
]`}
          </pre>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-0.5 sm:pt-1">
          <span className="text-[9px] sm:text-[10px] text-[#77736c] font-mono hidden sm:inline">
            ✦ Outputs strictly 4-choice MCQs
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="w-full sm:w-auto px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl border-2 border-[#191817] text-[10px] sm:text-xs font-black bg-white text-[#191817] hover:bg-[#eeeafd] hover:text-[#6c4de8] shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00cc05] stroke-[3]" />
                <span className="text-[#00cc05]">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#191817]" />
                <span>Copy Prompt Instructions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCVisual({ activeTab, setActiveTab }) {
  return (
    <div className="bg-[#fffdf7] border-2 border-[#191817] rounded-lg sm:rounded-2xl overflow-hidden shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] text-left">
      {/* Header */}
      <div className="bg-[#f7f5ef] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b-2 border-[#191817] flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#00cc05] text-white flex items-center justify-center border border-[#191817] text-xs">
            <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-black text-[#191817] leading-none">
              Import Quiz JSON
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#77736c] font-semibold mt-0.5 hidden sm:block">
              One-click question bank ingestion
            </div>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#08660a] bg-[#e6ffe6] px-1.5 py-0.5 sm:px-2 rounded-full border border-[#00cc05]/40">
          Fast Ingest
        </span>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b-2 border-[#191817] bg-white text-[10px] sm:text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            playSfx('button');
            setActiveTab('file');
          }}
          className={`flex-1 py-1 sm:py-1.5 text-center cursor-pointer ${
            activeTab === 'file'
              ? 'bg-[#e6ffe6] text-[#08660a] border-r-2 border-[#191817]'
              : 'text-[#77736c] border-r-2 border-[#191817]'
          }`}
        >
          📁 Upload .json File
        </button>
        <button
          type="button"
          onClick={() => {
            playSfx('button');
            setActiveTab('paste');
          }}
          className={`flex-1 py-1 sm:py-1.5 text-center cursor-pointer ${
            activeTab === 'paste'
              ? 'bg-[#e6ffe6] text-[#08660a]'
              : 'text-[#77736c]'
          }`}
        >
          📋 Paste Raw JSON
        </button>
      </div>

      {/* Body */}
      <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-3">
        {activeTab === 'file' ? (
          <div className="border-2 border-dashed border-[#191817] rounded-md sm:rounded-xl p-2 sm:p-3 text-center bg-white hover:bg-[#f7f5ef] transition-colors cursor-pointer">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#e6ffe6] text-[#00cc05] flex items-center justify-center mx-auto mb-1 border border-[#00cc05]">
              <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="font-bold text-[11px] sm:text-xs text-[#191817] block">
              biology_semester_exam.json
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#77736c] font-mono">
              3.4 KB · 10 Questions detected
            </span>
          </div>
        ) : (
          <div className="bg-[#fcfbf9] border-2 border-[#d8d3ca] rounded-md sm:rounded-xl p-2 font-mono text-[10px] sm:text-[11px] text-[#77736c] h-16 sm:h-20 overflow-hidden">
            {`{"title": "Biology Final", "questions": [{"stem": "..."}]}`}
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5 sm:pt-1">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-[#08660a]">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00cc05]" />
            <span>Schema validation passed</span>
          </div>

          <button
            type="button"
            onClick={() => playSfx('success')}
            className="kz-btn-primary px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817] flex items-center gap-1 cursor-pointer"
          >
            <span>Import to Library</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureDVisual({ exported, onExport }) {
  return (
    <div className="bg-[#fffdf7] border-2 border-[#191817] rounded-lg sm:rounded-2xl overflow-hidden shadow-[1.5px_1.5px_0_#191817] sm:shadow-[2px_2px_0_#191817] text-left">
      {/* Header */}
      <div className="bg-[#f7f5ef] px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b-2 border-[#191817] flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#8000ff] text-white flex items-center justify-center border border-[#191817] text-xs">
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-black text-[#191817] leading-none">
              Quiz Library Export
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#77736c] font-semibold mt-0.5 hidden sm:block">
              100% Data Portability & Offline Backup
            </div>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#4a0099] bg-[#f3eaff] px-1.5 py-0.5 sm:px-2 rounded-full border border-[#8000ff]/40">
          Universal JSON
        </span>
      </div>

      {/* Body: Mockup Quiz Library Card */}
      <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-3">
        <div className="bg-white border-2 border-[#191817] rounded-md sm:rounded-xl p-2 sm:p-3 shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817]">
          <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1">
            <div>
              <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#6c4de8] uppercase tracking-wider block">
                GENERAL SCIENCE
              </span>
              <h5 className="font-black text-xs sm:text-sm text-[#191817] leading-tight truncate">
                AP Chemistry: Thermodynamics Review
              </h5>
            </div>
            <span className="font-mono font-bold text-[9px] sm:text-[10px] bg-[#f7f5ef] border border-[#d8d3ca] px-1.5 py-0.5 sm:px-2 rounded-md text-[#191817] shrink-0">
              10 Qs
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-[#77736c] font-medium pt-0.5 sm:pt-1 border-t border-[#f0ece1]">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#6c4de8]" />
              <span>300s</span>
            </span>
            <span>·</span>
            <span>Medium</span>
            <span>·</span>
            <span className="text-[#00cc05] font-bold">Ready</span>
          </div>
        </div>

        {/* Action Button & Simulated download badge */}
        <div className="flex items-center justify-between pt-0.5 sm:pt-1">
          <div className="text-[9px] sm:text-[10px] text-[#77736c] font-mono">
            {exported ? (
              <span className="text-[#00cc05] font-bold flex items-center gap-0.5 sm:gap-1">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                <span className="truncate">Downloaded .json</span>
              </span>
            ) : (
              <span className="hidden sm:inline">Structured MCQ format with answers</span>
            )}
          </div>

          <button
            type="button"
            onClick={onExport}
            className="w-full sm:w-auto px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-xl border-2 border-[#191817] text-[10px] sm:text-xs font-black bg-white text-[#191817] hover:bg-[#f3eaff] hover:text-[#8000ff] shadow-[1px_1px_0_#191817] sm:shadow-[1.5px_1.5px_0_#191817] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8000ff]" />
            <span>{exported ? 'Downloaded!' : 'Export Quiz JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
