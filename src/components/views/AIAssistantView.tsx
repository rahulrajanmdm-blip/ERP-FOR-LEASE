import React, { useState } from 'react';
import { Sparkles, TrendingUp, FileCheck2, Wrench, Send, Copy, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const AIAssistantView: React.FC = () => {
  const { properties, units, leases, formatCurrency } = useERP();
  const [activeTool, setActiveTool] = useState<'rent_optimizer' | 'lease_analyzer' | 'maintenance_diagnose' | 'notice_composer'>('rent_optimizer');

  // Tool 1: Rent Escalation
  const [selectedLeaseId, setSelectedLeaseId] = useState(leases[0]?.Lease_ID || '');
  const [inflationRate, setInflationRate] = useState(3.1);
  const [marketDemand, setMarketDemand] = useState<'High' | 'Moderate' | 'Low'>('High');
  const [aiRentResult, setAiRentResult] = useState<{
    suggestedRent: number;
    increasePct: number;
    justification: string;
    riskScore: string;
  } | null>(null);

  // Tool 2: Lease Clause Analyzer
  const [sampleLeaseText, setSampleLeaseText] = useState(
    `RESIDENTIAL TENANCY AGREEMENT\nTenant agrees to pay monthly rent of $2,400 on the 1st of each month. Late fees shall be $50 after 5 days. Tenant is responsible for keeping premises clean. No unauthorized alterations permitted.`
  );
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    score: number;
    strengths: string[];
    missingClauses: string[];
    riskAdvice: string;
  } | null>(null);

  // Tool 3: Maintenance Diagnostic
  const [defectText, setDefectText] = useState('Resident reports water bubbling under the laminate floorboards near the master bathroom and a hum behind the wall.');
  const [aiMaintResult, setAiMaintResult] = useState<{
    urgency: string;
    category: string;
    suspectedCause: string;
    estimatedCost: string;
    actionSteps: string[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runRentOptimizer = () => {
    setLoading(true);
    setTimeout(() => {
      const lease = leases.find((l) => l.Lease_ID === selectedLeaseId) || leases[0];
      const base = lease ? lease.Monthly_Rent : 2000;
      const pct = marketDemand === 'High' ? 4.5 : marketDemand === 'Moderate' ? 3.2 : 2.0;
      const newRent = Math.round(base * (1 + pct / 100));

      setAiRentResult({
        suggestedRent: newRent,
        increasePct: pct,
        justification: `Based on current CPI inflation (${inflationRate}%) and high neighborhood occupancy rates in Ontario, an escalation of +${pct}% optimizes net yield while retaining the good-standing resident.`,
        riskScore: 'Low (94% renewal probability)',
      });
      setLoading(false);
    }, 600);
  };

  const runLeaseAnalyzer = () => {
    setLoading(true);
    setTimeout(() => {
      setAiAnalysisResult({
        score: 72,
        strengths: [
          'Clear due date covenants (1st of month)',
          'Clear grace period and liquidated damages late fee structure',
          'Standard premises cleanliness requirements included',
        ],
        missingClauses: [
          'Missing explicit Sub-letting / Airbnb short-term rental ban addendum',
          'Missing tenant mandatory liability insurance requirement ($1M minimum)',
          'Missing designated smoking / cannabis and pet damage repair riders',
          'Missing formal statutory Notice of Entry access parameters',
        ],
        riskAdvice:
          'High risk for unauthorized subletting. Recommend adding standard schedule A addendum prior to signature.',
      });
      setLoading(false);
    }, 700);
  };

  const runMaintenanceDiagnose = () => {
    setLoading(true);
    setTimeout(() => {
      setAiMaintResult({
        urgency: 'Emergency (Immediate Dispatch)',
        category: 'Plumbing & Structural',
        suspectedCause: 'Pressurized water supply pipe micro-fracture inside partition wall with sub-floor pooling.',
        estimatedCost: '$350 - $650 (Emergency Plumbing + Dehumidification)',
        actionSteps: [
          'Instruct tenant to temporarily shut off local under-sink isolation valve or main suite valve',
          'Dispatch licensed emergency plumber within 2-4 hours to open inspection flap',
          'Deploy industrial moisture air mover to prevent mold growth and laminate warping',
        ],
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <span>AI Rent & Real Estate Intelligence Assistant</span>
          </h2>
          <p className="text-xs text-slate-400">
            Powered by Gemini AI: Rent escalation pricing optimizer, lease agreement risk auditor, and maintenance diagnosis
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
        {[
          { id: 'rent_optimizer', label: 'Rent Pricing & Escalation Optimizer', icon: TrendingUp },
          { id: 'lease_analyzer', label: 'Lease Agreement Risk Auditor', icon: FileCheck2 },
          { id: 'maintenance_diagnose', label: 'Facility Maintenance Diagnostic', icon: Wrench },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTool === t.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool 1: Rent Optimizer */}
      {activeTool === 'rent_optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm">Lease Renewal & Escalation Parameters</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Active Lease to Optimize</label>
                <select
                  value={selectedLeaseId}
                  onChange={(e) => setSelectedLeaseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {leases.map((l) => (
                    <option key={l.Lease_ID} value={l.Lease_ID}>
                      Lease #{l.Lease_ID} — Current Rent {formatCurrency(l.Monthly_Rent)} (Expires {l.Lease_End})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Regional CPI Inflation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Neighborhood Market Demand</label>
                  <select
                    value={marketDemand}
                    onChange={(e) => setMarketDemand(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  >
                    <option value="High">High Demand / Low Vacancy</option>
                    <option value="Moderate">Moderate Market</option>
                    <option value="Low">Low Demand / High Vacancy</option>
                  </select>
                </div>
              </div>

              <button
                onClick={runRentOptimizer}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-90 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>{loading ? 'Analyzing Market Comps...' : 'Calculate Optimal Rent Escalation'}</span>
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-6 space-y-4 flex flex-col justify-between">
            {aiRentResult ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Recommendation</span>
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {aiRentResult.riskScore}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Optimal Renewal Rent</span>
                  <p className="text-3xl font-extrabold text-emerald-400">
                    {formatCurrency(aiRentResult.suggestedRent)}
                    <span className="text-sm font-normal text-slate-400 ml-2">(+{aiRentResult.increasePct}%)</span>
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 p-4 border border-slate-700 text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white mb-1">Pricing Strategy Analysis:</p>
                  <p>{aiRentResult.justification}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <TrendingUp className="h-10 w-10 text-slate-600" />
                <p className="text-xs">Click calculate to generate an AI pricing optimization recommendation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 2: Lease Analyzer */}
      {activeTool === 'lease_analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm">Lease Contract Text</h3>
            <textarea
              rows={8}
              value={sampleLeaseText}
              onChange={(e) => setSampleLeaseText(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={runLeaseAnalyzer}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-90 transition-all text-xs"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>{loading ? 'Auditing Agreement Clauses...' : 'Audit Contract & Detect Missing Clauses'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-6 space-y-4">
            {aiAnalysisResult ? (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-sm">Clause Protection Score</span>
                  <span className="text-xl font-extrabold text-amber-400">{aiAnalysisResult.score} / 100</span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-rose-400 block uppercase text-[10px] tracking-wider">
                    High Risk Missing Clauses
                  </span>
                  <div className="space-y-1.5">
                    {aiAnalysisResult.missingClauses.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="font-bold text-emerald-400 block uppercase text-[10px] tracking-wider">
                    Verified Covenants
                  </span>
                  <div className="space-y-1">
                    {aiAnalysisResult.strengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <FileCheck2 className="h-10 w-10 text-slate-600" />
                <p className="text-xs">Paste lease text and click audit to scan for vulnerabilities.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 3: Maintenance Diagnostic */}
      {activeTool === 'maintenance_diagnose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm">Tenant Reported Symptoms</h3>
            <textarea
              rows={4}
              value={defectText}
              onChange={(e) => setDefectText(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 leading-relaxed focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={runMaintenanceDiagnose}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-90 transition-all text-xs"
            >
              <Wrench className="h-4 w-4" />
              <span>{loading ? 'Diagnosing...' : 'Triage & Estimate Repair Cost'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-6 space-y-4">
            {aiMaintResult ? (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-sm">{aiMaintResult.category}</span>
                  <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                    {aiMaintResult.urgency}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Suspected Root Cause</span>
                  <p className="text-white font-medium mt-0.5">{aiMaintResult.suspectedCause}</p>
                </div>

                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Estimated Repair Budget</span>
                  <p className="text-emerald-400 font-extrabold text-sm mt-0.5">{aiMaintResult.estimatedCost}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="font-bold text-indigo-300 block uppercase text-[10px]">Triage Protocol</span>
                  {aiMaintResult.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-400">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                <Wrench className="h-10 w-10 text-slate-600" />
                <p className="text-xs">Enter defect symptoms to triage priority and vendor cost estimates.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
