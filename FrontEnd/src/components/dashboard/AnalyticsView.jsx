import React, { useState } from 'react';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

export default function AnalyticsView({
  preemptedOutages = 0,
  preemptedDelta = '+0',
  leadTimeSeconds = 0,
  mlPrecision = 0.0,
  mseThreshold = 20.0,
  currentMse = 0.0,
  incidentsCount = 0,
  incidentCategories = [
    { label: 'Micro-Arcing', percent: 0, color: '#f59e0b', strokeColor: '#f59e0b' },
    { label: 'Voltage Sags', percent: 0, color: '#38bdf8', strokeColor: '#38bdf8' },
    { label: 'Harmonics', percent: 0, color: '#a855f7', strokeColor: '#a855f7' },
    { label: 'Other', percent: 0, color: '#ea580c', strokeColor: '#ea580c' },
  ],
  incidents = [],
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    setTimeout(() => {
      // Create a printable telemetry report summary
      const reportContent = `
=====================================================
          GRYDAI HOSPITAL ANALYTICS REPORT
=====================================================
Generated: ${new Date().toLocaleString()}
Feeder ID: FEEDER-ICU-01 (Maple St. Substation Alpha)
Clearance Level: Tier-1 Alpha (Supervisor AM)

METRICS SUMMARY:
-----------------------------------------------------
Pre-empted Outages:      ${preemptedOutages} (${preemptedDelta} this month)
Mean Lead Time:          +${Math.floor(leadTimeSeconds / 60)}m ${(leadTimeSeconds % 60).toString().padStart(2, '0')}s
ML Precision:            ${mlPrecision.toFixed(1)}%
Trip Threshold:          ${mseThreshold.toFixed(1)} MSE
Current MSE Baseline:    ${currentMse.toFixed(2)} MSE
Incidents Logged:        ${incidentsCount}

INCIDENT CLASSIFICATIONS (30-DAY):
-----------------------------------------------------
Micro-Arcing:            ${incidentCategories[0]?.percent || 0}%
Voltage Sags:            ${incidentCategories[1]?.percent || 0}%
Harmonics:               ${incidentCategories[2]?.percent || 0}%
Other:                   ${incidentCategories[3]?.percent || 0}%

=====================================================
      AUTHENTICATED BY GRYDAI TELEMETRY ENGINE
=====================================================
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GrydAI-Analytics-Report-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 900);
  };

  // SVG Donut metrics calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Format lead time seconds into "+Xm Ys" format or "+0m 00s"
  const minutes = Math.floor(leadTimeSeconds / 60);
  const seconds = leadTimeSeconds % 60;
  const formattedLeadTime = `+${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  // Dynamic Y position for MSE spike based on currentMse (baseline at y=135, max peak at y=40)
  // When currentMse is 0, signal is flat at y = 135
  const baselineY = 135;
  const peakY = currentMse > 0 ? Math.max(40, baselineY - (currentMse / (mseThreshold * 1.3)) * 95) : baselineY;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-6 text-slate-100">
      {/* 1. Header Title & Subtitle + PDF Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-sans">
            Analytics Health Overview
          </h1>
          <p className="text-xs lg:text-sm text-[#94a3b8] mt-1 font-normal">
            Real-time hospital power telemetry & fault prediction
          </p>
        </div>

        {/* Yellow Rounded Corner PDF Report Gen Button */}
        <button
          onClick={handleGeneratePdf}
          disabled={isGenerating}
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-[#ffe600] hover:bg-[#ffd700] text-black font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer select-none shrink-0 border-0"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 size={17} className="text-black" />
              <span>Report Generated!</span>
            </>
          ) : (
            <>
              <FileText size={17} className="text-black" />
              <span>Generate PDF Report</span>
              <Download size={15} className="text-black" />
            </>
          )}
        </button>
      </div>

      {/* 2. Top Metric Cards Row (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Pre-Empted Outages */}
        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-[#64748b] uppercase font-bold">
              PRE-EMPTED OUTAGES
            </span>
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              {preemptedDelta} this month
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {preemptedOutages}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-[#64748b]">
            Automatic lead detections
          </div>
        </div>

        {/* Card 2: Mean Lead Time */}
        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-[#64748b] uppercase font-bold">
              MEAN LEAD TIME
            </span>
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30">
              {leadTimeSeconds > 0 ? 'Early Warning' : 'Standby'}
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {formattedLeadTime}
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-[#64748b]">
            Pre-fault breaker alert window
          </div>
        </div>

        {/* Card 3: ML Precision */}
        <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-[#64748b] uppercase font-bold">
              ML PRECISION
            </span>
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-semibold bg-white/[0.06] text-[#94a3b8] border border-white/[0.1]">
              {mlPrecision > 0 ? 'Nominal' : 'Calibrating'}
            </span>
          </div>
          <div className="my-2 sm:my-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
              {mlPrecision.toFixed(1)}%
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-[#64748b]">
            Isolation reconstruction accuracy
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Reconstruction Error Chart + Incident Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Reconstruction Error (MSE) */}
        <div className="lg:col-span-8 bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Reconstruction Error (MSE)
              </h3>
              <div className="text-[11px] font-mono text-[#64748b] tracking-wider uppercase mt-0.5">
                FEEDER-ICU-01 • 30-DAY CONTINUOUS SAMPLING
              </div>
            </div>
            <span className="px-3 py-1 rounded-md text-[11px] font-mono text-[#94a3b8] bg-white/[0.04] border border-white/[0.08]">
              Feeder 01
            </span>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-56 pt-2">
            <svg viewBox="0 0 700 180" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Trip Threshold Dashed Line at y = 55 (approx 20.0 MSE) */}
              <line
                x1="30"
                y1="55"
                x2="670"
                y2="55"
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                strokeOpacity="0.75"
              />
              <text
                x="500"
                y="50"
                fill="#ef4444"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="600"
                opacity="0.9"
              >
                TRIP THRESHOLD ({mseThreshold.toFixed(1)} MSE)
              </text>

              {/* Area Fill under curve if spike occurs */}
              {currentMse > 0 && (
                <path
                  d={`M 30 ${baselineY} L 200 ${baselineY} Q 260 ${baselineY} 295 ${peakY + 8} Q 300 ${peakY} 305 ${peakY + 8} Q 340 ${baselineY} 400 ${baselineY} L 670 ${baselineY} L 670 145 L 30 145 Z`}
                  fill="#facc15"
                  fillOpacity="0.12"
                />
              )}

              {/* Baseline continuous signal with live peak or flat resting signal */}
              <path
                d={
                  currentMse > 0
                    ? `M 30 ${baselineY} L 200 ${baselineY} Q 260 ${baselineY} 295 ${peakY + 8} Q 300 ${peakY} 305 ${peakY + 8} Q 340 ${baselineY} 400 ${baselineY} L 670 ${baselineY}`
                    : `M 30 ${baselineY} L 670 ${baselineY}`
                }
                fill="none"
                stroke="#facc15"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Peak indicator dot with ring (only visible if spike exists) */}
              {currentMse > 0 && (
                <>
                  <circle cx="300" cy={peakY} r="5" fill="#0b0e14" stroke="#facc15" strokeWidth="2" />
                  <circle cx="300" cy={peakY} r="2" fill="#facc15" />
                </>
              )}
            </svg>
          </div>

          {/* Chart X-Axis Dates */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] pt-2 border-t border-white/[0.05]">
            <span>Day 01</span>
            <span>Day 10</span>
            <span className={currentMse > 0 ? 'text-[#facc15] font-semibold' : 'text-[#64748b]'}>
              {currentMse > 0 ? `Spike (${currentMse.toFixed(1)})` : 'Baseline (0.0)'}
            </span>
            <span>Day 20</span>
            <span>Day 30</span>
          </div>
        </div>

        {/* Right Column (4 cols): Incident Distribution Donut */}
        <div className="lg:col-span-4 bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Incident Distribution
            </h3>
            <div className="text-[11px] font-mono text-[#64748b] tracking-wider uppercase mt-0.5">
              30-DAY CLASSIFICATION
            </div>
          </div>

          {/* Donut Chart with Centered Total Incidents */}
          <div className="relative flex items-center justify-center my-3">
            <svg className="w-36 h-36 transform -rotate-90 overflow-visible">
              {/* Background ring */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="11"
                fill="transparent"
              />

              {incidentsCount > 0 &&
                incidentCategories.map((item, idx) => {
                  const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -(accumulatedPercent / 100) * circumference;
                  accumulatedPercent += item.percent;
                  return (
                    <circle
                      key={idx}
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke={item.strokeColor}
                      strokeWidth="11"
                      fill="transparent"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                {incidentsCount}
              </span>
              <span className="text-[9px] font-mono text-[#64748b] tracking-widest uppercase">
                INCIDENTS
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-2 pt-1 border-t border-white/[0.05]">
            {incidentCategories.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#94a3b8]">{item.label}</span>
                </div>
                <span className="text-white font-semibold">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Table: Recent Incident Log */}
      <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Recent Incident Log
            </h3>
            <div className="text-[11px] font-mono text-[#64748b] tracking-wider uppercase mt-0.5">
              AUTOMATIC TELEMETRY INTERVENTIONS
            </div>
          </div>
          <div className="text-xs font-mono text-[#64748b]">
            Showing {incidents.length} of {incidentsCount}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#64748b] uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Asset / Wing</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Classification</th>
                <th className="pb-3 font-semibold text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#64748b]">
                    No anomalous incidents recorded. All feeders nominal.
                  </td>
                </tr>
              ) : (
                incidents.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-medium text-white">{row.asset}</td>
                    <td className="py-3.5 text-[#94a3b8]">{row.timestamp}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.classColor }} />
                        <span className="text-white font-medium">{row.classification}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${row.actionStyle}`}>
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
