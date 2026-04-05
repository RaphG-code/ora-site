import { useState, useEffect } from "react";
import {
  Sparkles, Filter, Table2, FileText,
  Clock, RotateCcw, BarChart2, Check, X,
  Download, Upload,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────── */
type DemoAction = "clean" | "extract" | "format" | "report" | "exportpdf" | "pdfexcel";
type DemoPhase  = "idle" | "selecting" | "processing" | "done";
type ThemeId    = "ib-blue" | "ib-dark" | "ib-green" | "ib-slate" | "ib-burgundy";
type PdfDL      = "idle" | "saving" | "saved";

interface ProductRow {
  name: string; date: string; price: string;
  c1: string; c2: string; c3: string; c4: string; c5: string;
  pct: string; gain: string;
}
interface DashTheme {
  id: ThemeId; label: string; swatch: string;
  hdr1: string; hdr2: string; col: string;
  alt: string; lbl: string; val: string; border: string;
}

/* ── Keyframes ───────────────────────────────────────────────── */
const demoCss = `
@keyframes demoScan {
  0%   { transform: translateX(-115%); }
  100% { transform: translateX(215%); }
}
@keyframes demoRowIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes selectorIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes dashIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes dlBar {
  from { width: 0%; }
  to   { width: 100%; }
}
@keyframes dlBounce {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
`;

/* ── Dashboard colour themes ─────────────────────────────────── */
const THEMES: DashTheme[] = [
  { id:"ib-blue",    label:"IB Blue",    swatch:"#2e75b6", hdr1:"#1e3a7a", hdr2:"#2e75b6", col:"#2e75b6", alt:"#d9e1f2", lbl:"#2e75b6", val:"#111827", border:"#c5d8f7" },
  { id:"ib-dark",    label:"IB Dark",    swatch:"#1a1f2e", hdr1:"#0d1117", hdr2:"#161b22", col:"#21262d", alt:"#161b22", lbl:"#58a6ff", val:"#c9d1d9", border:"#30363d" },
  { id:"ib-green",   label:"IB Green",   swatch:"#1b5e37", hdr1:"#0d2b1a", hdr2:"#1b5e37", col:"#1b5e37", alt:"#d4edd9", lbl:"#145a2e", val:"#111827", border:"#a7d7be" },
  { id:"ib-slate",   label:"IB Slate",   swatch:"#475569", hdr1:"#1e293b", hdr2:"#334155", col:"#475569", alt:"#e2e8f0", lbl:"#334155", val:"#111827", border:"#cbd5e1" },
  { id:"ib-burgundy",label:"IB Burgundy",swatch:"#881337", hdr1:"#3d0c1c", hdr2:"#881337", col:"#881337", alt:"#fce7ef", lbl:"#881337", val:"#111827", border:"#f9a8c0" },
];

/* ── Action list ─────────────────────────────────────────────── */
const actionList: { id: DemoAction; label: string; icon: React.ElementType }[] = [
  { id:"clean",     label:"Clean Data",    icon:Sparkles  },
  { id:"extract",   label:"Extract Fields",icon:Filter    },
  { id:"format",    label:"Format Table",  icon:Table2    },
  { id:"report",    label:"Build Report",  icon:FileText  },
  { id:"exportpdf", label:"Export PDF",    icon:Download  },
  { id:"pdfexcel",  label:"PDF → Excel",  icon:Upload    },
];

/* ── Product data ────────────────────────────────────────────── */
const PRODUCTS: ProductRow[] = [
  { name:"Product A", date:"01/01/2024", price:"980",  c1:"30", c2:"30", c3:"30", c4:"30", c5:"1,03",  pct:"5.2%", gain:"82"  },
  { name:"Product B", date:"15/03/2024", price:"1,00", c1:"25", c2:"25", c3:"25", c4:"25", c5:"1,025", pct:"4.1%", gain:"125" },
  { name:"Product C", date:"30/06/2025", price:"950",  c1:"35", c2:"35", c3:"35", c4:"35", c5:"1,05",  pct:"6.8%", gain:"240" },
  { name:"Product D", date:"01/09/2025", price:"1,02", c1:"20", c2:"20", c3:"20", c4:"20", c5:"1,02",  pct:"3.6%", gain:"80"  },
  { name:"Product E", date:"15/12/2024", price:"990",  c1:"28", c2:"28", c3:"28", c4:"28", c5:"1,04",  pct:"5.0%", gain:"162" },
  { name:"Product F", date:"01/02/2025", price:"970",  c1:"32", c2:"32", c3:"32", c4:"32", c5:"1,03",  pct:"6.1%", gain:"218" },
  { name:"Product G", date:"20/05/2024", price:"1,01", c1:"22", c2:"22", c3:"22", c4:"22", c5:"1,01",  pct:"3.9%", gain:"88"  },
];

/* ── Spreadsheet rows ────────────────────────────────────────── */
const RAW_HEADERS = ["Product", "Issuance date", "Price", "%", "Gain"];
const RAW_ROWS = [
  ["Product A","01/01/2024","980",  "5.2%","82"  ],
  ["Product B","15-03-24",  "1",    "4.1", "125" ],
  ["Product C","June 30",   "950",  "6.8%","240" ],
  ["Product D","01/09/2025","1,02", "3.6%","80"  ],
  ["Product E","15/12/2024","990",  "5",   "162" ],
  ["Product F","2025-02-01","970",  "6.1%","218" ],
  ["Product G","20/05/2024","1.01", "3.9%","88"  ],
];
const MESSY = new Set(["1,1","1,3","2,1","4,3","5,1","6,2"]);
const CLEAN_ROWS = [
  ["Product A","01/01/2024","980",  "5.2%","82"  ],
  ["Product B","15/03/2024","1,00", "4.1%","125" ],
  ["Product C","30/06/2025","950",  "6.8%","240" ],
  ["Product D","01/09/2025","1,02", "3.6%","80"  ],
  ["Product E","15/12/2024","990",  "5.0%","162" ],
  ["Product F","01/02/2025","970",  "6.1%","218" ],
  ["Product G","20/05/2024","1,01", "3.9%","88"  ],
];
const EXTRACT_HDRS = ["Product","Date","Price","Coupon","Gain","Cat."];
const EXTRACT_ROWS = [
  ["Product A","01/01/2024","980", "30","82", "Mid" ],
  ["Product B","15/03/2024","1,00","25","125","Low" ],
  ["Product C","30/06/2025","950", "35","240","High"],
  ["Product D","01/09/2025","1,02","20","80", "Low" ],
  ["Product E","15/12/2024","990", "28","162","Mid" ],
  ["Product F","01/02/2025","970", "32","218","High"],
  ["Product G","20/05/2024","1,01","22","88", "Low" ],
];
const FORMAT_ROWS = [...CLEAN_ROWS, ["AVG / TOT","—","—","5.1%","151"]];


/* ── Helpers ─────────────────────────────────────────────────── */
const dashMetrics = (p: ProductRow) => [
  { label:"Product",      value:p.name  },
  { label:"Issuance date",value:p.date  },
  { label:"Price",        value:p.price },
  { label:"1 Coupon",     value:p.c1    },
  { label:"2 Coupon",     value:p.c2    },
  { label:"3 Coupon",     value:p.c3    },
  { label:"4 Coupon",     value:p.c4    },
  { label:"5 Coupon",     value:p.c5    },
  { label:"%",            value:p.pct   },
  { label:"Gain",         value:p.gain  },
];

const EXTRA_COLS    = ["C","D","E"];
const EMPTY_ROWS_BW = [15,16,17];

/* ── Component ───────────────────────────────────────────────── */
export default function HeroDemoCard({ dk }: { dk: boolean }) {
  const [selRow,       setSelRow]       = useState(0);
  const [activeAction, setActiveAction] = useState<DemoAction | null>(null);
  const [phase,        setPhase]        = useState<DemoPhase>("idle");
  const [themeId,      setThemeId]      = useState<ThemeId>("ib-blue");
  const [pdfDL,        setPdfDL]        = useState<PdfDL>("idle");

  /* Auto-trigger PDF download animation */
  useEffect(() => {
    if (phase === "done" && activeAction === "exportpdf") {
      const t1 = setTimeout(() => setPdfDL("saving"), 800);
      const t2 = setTimeout(() => setPdfDL("saved"),  1900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    setPdfDL("idle");
  }, [phase, activeAction]);

  const trigger = (action: DemoAction) => {
    if (phase === "processing") return;
    if (action === "report") {
      if (phase === "selecting") { setPhase("idle"); setActiveAction(null); }
      else { setActiveAction("report"); setPhase("selecting"); }
      return;
    }
    setActiveAction(action);
    setPhase("processing");
    setTimeout(() => setPhase("done"), 920);
  };

  const pickAndRun = (idx: number) => {
    setSelRow(idx);
    setPhase("processing");
    setTimeout(() => setPhase("done"), 920);
  };

  const reset = () => { setPhase("idle"); setActiveAction(null); setPdfDL("idle"); };

  const isIdle       = phase === "idle";
  const isProc       = phase === "processing";
  const isSelecting  = phase === "selecting";
  const isDone       = phase === "done";
  const isReport     = isDone && activeAction === "report";
  const isExportPdf  = isDone && activeAction === "exportpdf";
  const isPdfExcel   = isDone && activeAction === "pdfexcel";

  const theme   = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const product = PRODUCTS[selRow];

  const curHeaders =
    isDone && activeAction === "extract" ? EXTRACT_HDRS : RAW_HEADERS;
  const curRows    =
    isDone && activeAction === "extract"                              ? EXTRACT_ROWS :
    isDone && activeAction === "format"                               ? FORMAT_ROWS  :
    isDone && (activeAction === "clean" || activeAction === "pdfexcel") ? CLEAN_ROWS   :
    RAW_ROWS;

  /* Excel grid tokens */
  const gridLine   = dk ? "rgba(255,255,255,0.07)" : "#dde1e7";
  const cellBorder = dk ? "rgba(255,255,255,0.18)" : "#c8ccd2"; /* visible Excel-style cell border */
  const numBg     = dk ? "#111a2c" : "#f0f1f3";
  const numTxt    = dk ? "#5a6a85" : "#6b7280";
  const cellBg    = dk ? "#0a1120" : "#ffffff";
  const altBg     = dk ? "#0c1428" : "#f8f9fc";
  const hdrBg     = dk ? "#142035" : "#e8f0fe";
  const hdrTxt    = dk ? "#7dd3fc" : "#1e40af";
  const accentClr = dk ? "#38bdf8" : "#2563eb";
  const ribbonBg  = dk ? "#0d1625" : "#f7f8fa";
  const selBg     = dk ? "rgba(56,189,248,0.07)" : "#f0f6ff";
  const selNumBg  = dk ? "#1e3a5f" : "#c5d8f7";
  const selNumTxt = dk ? "#7dd3fc" : "#1d4ed8";

  const numCell = (active = false): React.CSSProperties => ({
    fontSize:8, fontWeight:600, textAlign:"right",
    padding:"2px 3px",
    borderRight:`1px solid ${gridLine}`, borderBottom:`1px solid ${gridLine}`,
    background: active ? selNumBg : numBg,
    color:      active ? selNumTxt : numTxt,
    userSelect:"none",
  });

  const dbCell = (i: number): React.CSSProperties => ({
    fontSize:8, padding:"2px 7px",
    borderBottom:`1px solid ${theme.border}`,
    background: i % 2 === 0 ? "#ffffff" : theme.alt,
  });

  /* Formula bar content */
  const fxContent =
    isExportPdf  ? `=EXPORT_PDF("${product.name}", "A1:B14")`
    : isPdfExcel ? `=IMPORT_PDF("Q1_report.pdf", sheet:="Feuil1")`
    : isReport   ? `=DASHBOARD("${product.name}")`
    : isProc     ? "…"
    : activeAction === "clean"   ? `=CLEAN(A${selRow+2})`
    : activeAction === "extract" ? `=VLOOKUP(A${selRow+2},data,3,0)`
    : activeAction === "format"  ? `=TEXT(D${selRow+2},"0.0%")`
    : PRODUCTS[selRow]?.name ?? "";

  /* Whether to show the spreadsheet table */
  const showSpreadsheet = !isSelecting && !isExportPdf;

  return (
    <div className="hero-stagger hero-d5 relative lg:scale-110 lg:origin-center">
      <style>{demoCss}</style>

      {/* ── Outer glow shell ── */}
      <div
        className={["rounded-[28px] p-4 md:p-5 relative overflow-hidden",
          dk ? "border border-sky-400/[0.08]" : "border border-[rgba(120,160,255,0.15)]"].join(" ")}
        style={{
          background: dk ? "rgba(14,165,233,0.04)" : "linear-gradient(135deg,#EEF5FF 0%,#E6F0FF 40%,#DCE9FF 100%)",
          boxShadow: dk ? "0 8px 40px rgba(0,0,0,0.3)" : "0 20px 60px rgba(80,120,255,0.12),0 4px 16px rgba(80,120,255,0.06),inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {!dk && (
          <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{
            backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity:0.03, mixBlendMode:"soft-light" as React.CSSProperties["mixBlendMode"],
          }} />
        )}

        {/* ── Inner card ── */}
        <div
          className={["relative rounded-3xl overflow-hidden border",
            dk ? "bg-[#0a1120]/90 border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
               : "bg-white/95 border-gray-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"].join(" ")}
          style={{ backdropFilter:"blur(8px)" }}
        >

          {/* Window chrome */}
          <div className={["flex items-center justify-between px-4 py-2 border-b",
            dk ? "border-white/[0.07]" : "border-gray-200/80"].join(" ")}
            style={{ background:ribbonBg }}>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className={["text-[10px] font-medium", dk ? "text-gray-400" : "text-gray-500"].join(" ")}>
                Ora Automation
                <span className={["ml-1.5", dk ? "text-gray-600" : "text-gray-400"].join(" ")}>
                  products_Q1.xlsx
                </span>
              </span>
            </div>
            {(isDone || isSelecting) ? (
              <button onClick={reset} className={["flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors",
                dk ? "text-gray-500 hover:text-gray-200 hover:bg-white/[0.07]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"].join(" ")}>
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
            ) : (
              <span className={["text-[9px]", dk ? "text-gray-600" : "text-gray-400"].join(" ")}>
                {isProc ? "Processing…" : "Run an action ↓"}
              </span>
            )}
          </div>

          {/* ── Action buttons (always) ── */}
          <div className={["flex items-center gap-1 px-3 py-1 border-b flex-wrap",
            dk ? "border-white/[0.07]" : "border-gray-200/80"].join(" ")}
            style={{ background:ribbonBg }}>
            {actionList.map(a => {
              const Icon     = a.icon;
              const spinning = activeAction === a.id && isProc;
              const active   = activeAction === a.id && isDone;
              const picking  = a.id === "report" && isSelecting;
              return (
                <button key={a.id} onClick={() => trigger(a.id)} disabled={isProc}
                  className={["inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-medium transition-all duration-150 disabled:cursor-not-allowed select-none",
                    active || picking
                      ? dk ? "bg-sky-500/20 text-sky-300 border border-sky-400/40" : "bg-blue-50 text-blue-700 border border-blue-200"
                      : dk ? "text-gray-400 border border-white/[0.08] hover:text-gray-100 hover:bg-white/[0.07]" : "text-gray-500 border border-gray-200 bg-white hover:text-gray-800 hover:bg-gray-50",
                    activeAction === a.id && isProc ? "opacity-50" : "",
                  ].join(" ")}
                >
                  {spinning
                    ? <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin inline-block flex-shrink-0" />
                    : <Icon className="w-2 h-2 flex-shrink-0" />
                  }
                  {a.label}
                </button>
              );
            })}
          </div>

          {/* ── Theme picker (always) ── */}
          <div className={["flex items-center gap-1.5 px-3 py-1 border-b",
            dk ? "border-white/[0.07]" : "border-gray-200/80"].join(" ")}
            style={{ background: dk ? "#0a0f1a" : "#f2f4f8" }}>
            <span className={["text-[8px] font-semibold mr-0.5 flex-shrink-0", dk ? "text-gray-500" : "text-gray-400"].join(" ")}>
              Design:
            </span>
            {THEMES.map(t => {
              const active = t.id === themeId;
              return (
                <button key={t.id} onClick={() => setThemeId(t.id)} title={t.label}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all duration-150 border"
                  style={{
                    background:  active ? t.hdr2+"22" : "transparent",
                    borderColor: active ? t.swatch : (dk ? "rgba(255,255,255,0.09)" : "#e2e8f0"),
                    color:       active ? t.swatch : (dk ? "#6b7280" : "#9ca3af"),
                  }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background:t.swatch, boxShadow: active ? `0 0 0 1.5px white, 0 0 0 2.5px ${t.swatch}` : "none" }} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Formula bar */}
          <div className={["flex items-stretch border-b", dk ? "border-white/[0.07]" : "border-gray-200/70"].join(" ")}>
            <div className="flex-shrink-0 flex items-center justify-center font-mono font-semibold border-r text-[8px]"
              style={{ width:40, background: dk ? "#111a2c" : "#f0f1f3", color: isReport ? theme.lbl : (dk ? "#7dd3fc" : "#2563eb"), borderColor:gridLine, padding:"2px 4px" }}>
              {isReport || isExportPdf ? "A1" : `A${selRow+2}`}
            </div>
            <div className="flex items-center border-r px-1.5 text-[8px] italic font-medium flex-shrink-0"
              style={{ background:ribbonBg, color: dk ? "#5a6a85" : "#9ca3af", borderColor:gridLine }}>fx</div>
            <div className="flex-1 flex items-center font-mono truncate text-[8px]"
              style={{ background:cellBg, color: dk ? "#c9d1de" : "#374151", padding:"2px 8px" }}>
              {fxContent}
            </div>
          </div>

          {/* ── Content area ── */}
          <div className="relative overflow-hidden">

            {/* Scan sweep */}
            {isProc && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <div style={{
                  position:"absolute", inset:0,
                  background: dk
                    ? "linear-gradient(90deg,transparent 0%,rgba(56,189,248,0.05) 30%,rgba(56,189,248,0.16) 50%,rgba(56,189,248,0.05) 70%,transparent 100%)"
                    : "linear-gradient(90deg,transparent 0%,rgba(37,99,235,0.03) 30%,rgba(37,99,235,0.09) 50%,rgba(37,99,235,0.03) 70%,transparent 100%)",
                  animation:"demoScan 0.92s cubic-bezier(0.4,0,0.2,1) forwards",
                }} />
              </div>
            )}

            {/* ─── PRODUCT SELECTOR ─── */}
            {isSelecting && (
              <div style={{ animation:"selectorIn 0.2s ease both" }}>
                <div className={["flex items-center justify-between px-3 py-1.5 border-b",
                  dk ? "border-white/[0.07]" : "border-gray-100"].join(" ")}
                  style={{ background: dk ? "#0d1625" : "#f7f8fa" }}>
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className={["w-3 h-3", dk ? "text-sky-400" : "text-blue-500"].join(" ")} />
                    <span className={["text-[9px] font-semibold", dk ? "text-gray-300" : "text-gray-700"].join(" ")}>
                      Build dashboard for:
                    </span>
                  </div>
                  <button onClick={() => { setPhase("idle"); setActiveAction(null); }}
                    className={["flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded transition-colors",
                      dk ? "text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"].join(" ")}>
                    <X className="w-2.5 h-2.5" /> Cancel
                  </button>
                </div>
                {PRODUCTS.map((p, i) => {
                  const isSel = i === selRow;
                  return (
                    <div key={i} onClick={() => pickAndRun(i)}
                      className="flex items-center cursor-pointer"
                      style={{
                        padding:"4px 10px", borderBottom:`1px solid ${gridLine}`,
                        background: isSel ? (dk ? "rgba(56,189,248,0.08)" : "#eff6ff") : (dk ? cellBg : "#fff"),
                        animation:`demoRowIn 0.2s ease ${i*22}ms both`,
                      }}>
                      <div className="flex-shrink-0 mr-2 flex items-center justify-center rounded-full"
                        style={{ width:12, height:12,
                          background: isSel ? (dk ? "#38bdf8" : "#2563eb") : "transparent",
                          border:`1.5px solid ${isSel ? (dk ? "#38bdf8" : "#2563eb") : (dk ? "#2a3a52" : "#d1d5db")}`,
                        }}>
                        {isSel && <Check className="w-1.5 h-1.5 text-white" strokeWidth={3.5} />}
                      </div>
                      <span className="text-[9px] font-semibold flex-1"
                        style={{ color: isSel ? (dk ? "#7dd3fc" : "#1d4ed8") : (dk ? "#c9d1de" : "#374151") }}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[8px] tabular-nums" style={{ color: dk ? "#5a6a85" : "#9ca3af" }}>{p.date}</span>
                        <span className="text-[8px] font-semibold tabular-nums px-1 py-px rounded"
                          style={{ background: dk ? "rgba(134,239,172,0.10)" : "#f0fdf4", color: dk ? "#86efac" : "#15803d" }}>
                          {p.pct}
                        </span>
                        <span className="text-[8px] font-medium tabular-nums w-7 text-right"
                          style={{ color: dk ? "#c9d1de" : "#374151" }}>{p.gain}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── PDF VIEWER (Export PDF) ─── */}
            {isExportPdf && (
              <div style={{ background: dk ? "#1a1a2e" : "#c8c8c8", animation:"dashIn 0.25s ease both" }}>

                {/* Viewer toolbar */}
                <div style={{ background: dk ? "#0d0d1a" : "#3c3c3c", padding:"3px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"#aaaaaa", fontSize:8 }}>
                    products_Q1.pdf  ·  Page 1 / 1
                  </span>
                  {pdfDL === "idle" && (
                    <span style={{ color:"#777", fontSize:8, display:"flex", alignItems:"center", gap:3 }}>
                      <span className="w-2 h-2 rounded-full border border-gray-500 border-t-transparent animate-spin inline-block" />
                      Preparing…
                    </span>
                  )}
                  {pdfDL === "saving" && (
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:44, height:3, background:"#444", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:"#4ade80", animation:"dlBar 1s ease forwards", borderRadius:2 }} />
                      </div>
                      <span style={{ color:"#aaa", fontSize:8 }}>Saving…</span>
                    </div>
                  )}
                  {pdfDL === "saved" && (
                    <span style={{ color:"#4ade80", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                      <span>✓</span> Saved · products_Q1.pdf
                    </span>
                  )}
                </div>

                {/* Paper */}
                <div style={{ padding:"8px 12px", display:"flex", justifyContent:"center" }}>
                  <div style={{
                    background:"#ffffff", width:"73%",
                    padding:"10px 12px",
                    boxShadow:"0 3px 16px rgba(0,0,0,0.35)",
                    borderRadius:1,
                    animation:"dashIn 0.3s ease 0.05s both",
                  }}>
                    {/* PDF header */}
                    <div style={{ borderBottom:`1.5px solid ${theme.hdr1}`, paddingBottom:5, marginBottom:5 }}>
                      <div style={{ fontSize:9.5, fontWeight:800, color:theme.hdr1, letterSpacing:"0.05em", textTransform:"uppercase" }}>
                        Product Dashboard
                      </div>
                      <div style={{ fontSize:7, color:"#6b7280", marginTop:1.5 }}>
                        {product.name} · Ora Automation · {new Date().toLocaleDateString("fr-FR")}
                      </div>
                    </div>

                    {/* Metrics in PDF */}
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <tbody>
                        {dashMetrics(product).slice(0,8).map((m, i) => (
                          <tr key={m.label} style={{ animation:`demoRowIn 0.2s ease ${i*28}ms both` }}>
                            <td style={{ fontSize:7, padding:"1.5px 0", color:theme.lbl, fontWeight:700, width:"46%" }}>{m.label}</td>
                            <td style={{ fontSize:7, padding:"1.5px 0", color:"#111827",
                              borderBottom: i < 7 ? "0.5px solid #e5e7eb" : "none" }}>
                              {m.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* PDF footer */}
                    <div style={{ marginTop:5, paddingTop:3, borderTop:"0.5px solid #e5e7eb",
                      fontSize:6.5, color:"#9ca3af", display:"flex", justifyContent:"space-between" }}>
                      <span>Ora Automation · Confidentiel</span>
                      <span>p. 1</span>
                    </div>
                  </div>
                </div>

                {/* Download confirmation strip */}
                {pdfDL === "saved" && (
                  <div style={{ background:"#14532d", padding:"3px 10px", display:"flex", alignItems:"center", gap:5, animation:"dashIn 0.2s ease both" }}>
                    <Download style={{ width:9, height:9, color:"#4ade80" }} />
                    <span style={{ fontSize:8, color:"#86efac", fontWeight:600 }}>
                      products_Q1.pdf downloaded successfully
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ─── SPREADSHEET (normal / report / pdfexcel) ─── */}
            {showSpreadsheet && (
              <>
                {/* PDF→Excel source banner */}
                {isPdfExcel && (
                  <div style={{
                    background: dk ? "rgba(254,243,199,0.08)" : "#fffbeb",
                    borderBottom: `1px solid ${dk ? "rgba(251,191,36,0.20)" : "#fde68a"}`,
                    padding:"3px 10px", display:"flex", alignItems:"center", gap:4,
                    animation:"dashIn 0.2s ease both",
                  }}>
                    <FileText style={{ width:9, height:9, color: dk ? "#fbbf24" : "#d97706", flexShrink:0 }} />
                    <span style={{ fontSize:8, color: dk ? "#fbbf24" : "#92400e", fontWeight:600 }}>
                      Extracted from: Q1_report.pdf
                    </span>
                    <span style={{ marginLeft:"auto", fontSize:7.5, color: dk ? "#86efac" : "#15803d", fontWeight:700 }}>
                      ✓ 7 rows · 5 columns · Clean
                    </span>
                  </div>
                )}

                <table className="w-full border-collapse" style={{
                  tableLayout:"fixed",
                  opacity: isProc ? 0.5 : 1,
                  animation: isReport ? "dashIn 0.28s ease both" : undefined,
                }}>
                  <colgroup>
                    <col style={{ width:18 }} />
                    {isReport ? (
                      <>
                        <col style={{ width:"37%" }} />
                        <col style={{ width:"33%" }} />
                        <col style={{ width:"10%" }} />
                        <col style={{ width:"10%" }} />
                        <col style={{ width:"10%" }} />
                      </>
                    ) : curHeaders.length === 6 ? (
                      <>
                        <col style={{ width:"22%" }} /><col style={{ width:"20%" }} />
                        <col style={{ width:"12%" }} /><col style={{ width:"12%" }} />
                        <col style={{ width:"20%" }} /><col style={{ width:"14%" }} />
                      </>
                    ) : (
                      <>
                        <col style={{ width:"24%" }} /><col style={{ width:"23%" }} />
                        <col style={{ width:"15%" }} /><col style={{ width:"16%" }} />
                        <col style={{ width:"16%" }} />
                      </>
                    )}
                  </colgroup>

                  <thead>
                    {/* Column letter row */}
                    <tr>
                      <th style={{ background:numBg, borderRight:`1px solid ${gridLine}`, borderBottom:`1px solid ${gridLine}`, height:14 }} />
                      {(isReport ? ["A","B",...EXTRA_COLS] : curHeaders.map((_,i) => String.fromCharCode(65+i))).map(l => (
                        <th key={l} className="text-center font-semibold select-none"
                          style={{ fontSize:8, background:numBg, color:numTxt, borderRight:`1px solid ${gridLine}`, borderBottom:`1px solid ${gridLine}`, height:14 }}>
                          {l}
                        </th>
                      ))}
                    </tr>

                    {/* Spreadsheet header row (non-report only) */}
                    {!isReport && (
                      <tr>
                        <td style={numCell()} />
                        {curHeaders.map((h,ci) => (
                          <td key={ci} className="truncate font-bold"
                            style={{ fontSize:9, background:hdrBg, color:hdrTxt, padding:"2px 5px",
                              borderRight:`1px solid ${gridLine}`, borderBottom:`2px solid ${accentClr}` }}>
                            {h}
                          </td>
                        ))}
                      </tr>
                    )}
                  </thead>

                  <tbody>
                    {isReport ? (
                      /* Dashboard embedded in grid */
                      <>
                        {/* Row 1 — PRODUCT DASHBOARD */}
                        <tr>
                          <td style={{ ...numCell(), background: dk ? "#0d2650" : theme.hdr1, color:"rgba(255,255,255,0.5)" }}>1</td>
                          <td colSpan={2} style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", padding:"5px 8px", background:theme.hdr1, color:"#ffffff", borderRight:`1px solid ${cellBorder}`, borderBottom:`1px solid rgba(255,255,255,0.12)` }}>
                            Product Dashboard
                          </td>
                          {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                        </tr>
                        {/* Row 2 — Product name */}
                        <tr>
                          <td style={{ ...numCell(), background: dk ? "#0d2650" : theme.hdr2, color:"rgba(255,255,255,0.4)" }}>2</td>
                          <td colSpan={2} style={{ fontSize:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.12em", padding:"3px 8px", background:theme.hdr2, color:"rgba(255,255,255,0.75)", borderRight:`1px solid ${cellBorder}`, borderBottom:`1px solid rgba(255,255,255,0.10)` }}>
                            {product.name}
                          </td>
                          {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                        </tr>
                        {/* Row 3 — spacer */}
                        <tr>
                          <td style={numCell()}>3</td>
                          <td colSpan={2} style={{ background:theme.hdr2, borderRight:`1px solid ${cellBorder}`, borderBottom:`1px solid rgba(255,255,255,0.08)`, height:6 }} />
                          {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                        </tr>
                        {/* Row 4 — MÉTRIQUE | VALEUR */}
                        <tr>
                          <td style={numCell()}>4</td>
                          <td style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", textAlign:"center", padding:"3px 6px", background:theme.col, color:"#ffffff", borderRight:`1px solid rgba(255,255,255,0.18)`, borderBottom:`1px solid rgba(255,255,255,0.12)` }}>
                            Métrique
                          </td>
                          <td style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", textAlign:"center", padding:"3px 6px", background:theme.col, color:"#ffffff", borderRight:`1px solid ${cellBorder}`, borderBottom:`1px solid rgba(255,255,255,0.12)` }}>
                            Valeur
                          </td>
                          {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                        </tr>
                        {/* Rows 5-14 — metric data */}
                        {dashMetrics(product).map((m, i) => (
                          <tr key={m.label} style={{ animation:`demoRowIn 0.2s ease ${i*20}ms both` }}>
                            <td style={numCell()}>{i+5}</td>
                            <td style={{ ...dbCell(i), color:theme.lbl, fontWeight:700, borderRight:`1px solid ${theme.border}` }}>{m.label}</td>
                            <td style={{ ...dbCell(i), color:theme.val, borderRight:`1px solid ${cellBorder}` }}>{m.value}</td>
                            {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                          </tr>
                        ))}
                        {/* Empty rows below */}
                        {EMPTY_ROWS_BW.map((n) => (
                          <tr key={n}>
                            <td style={numCell()}>{n}</td>
                            <td style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />
                            <td style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />
                            {EXTRA_COLS.map(c => <td key={c} style={{ background:cellBg, border:`1px solid ${cellBorder}` }} />)}
                          </tr>
                        ))}
                      </>
                    ) : (
                      /* Normal spreadsheet rows */
                      curRows.map((row, ri) => {
                        const isTot = isDone && activeAction === "format" && ri === curRows.length-1;
                        return (
                          <tr key={ri} onClick={() => !isProc && !isTot && setSelRow(ri)}
                            className={!isTot ? "cursor-pointer" : ""}
                            style={isDone ? { animation:`demoRowIn 0.24s cubic-bezier(.22,1,.36,1) ${ri*26}ms both` } : undefined}>
                            <td style={{ ...numCell(ri===selRow && !isTot),
                              background: ri===selRow && !isTot ? selNumBg : isTot ? (dk ? "#142035" : "#eff6ff") : numBg,
                              color:      ri===selRow && !isTot ? selNumTxt : numTxt }}>
                              {ri+2}
                            </td>
                            {row.map((cell, ci) => {
                              const messy   = (isIdle||isProc) && MESSY.has(`${ri},${ci}`);
                              const isTotLbl= isTot && ci===1;
                              const isTotNum= isTot && (ci===3||ci===4);
                              return (
                                <td key={ci} className="truncate tabular-nums"
                                  style={{
                                    fontSize:9, padding:"2px 5px",
                                    borderRight:  `1px solid ${gridLine}`,
                                    borderBottom: `1px solid ${gridLine}`,
                                    borderTop:    isTot ? `1px solid ${dk?"rgba(56,189,248,0.25)":"#bfdbfe"}` : undefined,
                                    borderLeft:   ri===selRow&&!isTot&&ci===0 ? `2px solid ${accentClr}` : undefined,
                                    background: isTot ? (dk?"rgba(56,189,248,0.05)":"#eff6ff") : ri===selRow&&!isTot ? selBg : ri%2===1 ? altBg : cellBg,
                                    fontWeight: isTotLbl||isTotNum ? 700 : ci===0 ? 600 : 400,
                                    color: messy ? (dk?"rgba(251,146,60,0.85)":"rgba(234,88,12,0.9)")
                                      : isTotNum   ? (dk?"#7dd3fc":"#1d4ed8")
                                      : ci===0     ? (dk?"#7dd3fc":"#1e40af")
                                      : ci===4&&isDone&&!isTot ? (dk?"#86efac":"#15803d")
                                      : (dk?"#c9d1de":"#374151"),
                                  }}>
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Sheet tabs */}
          <div className="flex items-end border-t" style={{ background: dk ? "#0a1120" : "#f0f1f3", borderColor:gridLine }}>
            {isReport ? (
              <>
                <div className="px-2.5 py-[3px] text-[8px] border-r cursor-pointer select-none"
                  style={{ color: dk?"#5a6a85":"#9ca3af", borderColor:gridLine }}>Feuil1</div>
                <div className="px-2.5 py-[3px] text-[8px] font-semibold border-r border-t-2 select-none"
                  style={{ background: dk?"#0a1120":"#fff", color:theme.lbl, borderColor:gridLine, borderTopColor:theme.swatch }}>
                  DB — {product.name}
                </div>
              </>
            ) : isExportPdf ? (
              <>
                <div className="px-2.5 py-[3px] text-[8px] border-r cursor-pointer select-none"
                  style={{ color: dk?"#5a6a85":"#9ca3af", borderColor:gridLine }}>Feuil1</div>
                <div className="px-2.5 py-[3px] text-[8px] font-semibold border-r border-t-2 select-none"
                  style={{ background: dk?"#0a1120":"#fff", color: pdfDL==="saved" ? "#15803d" : (dk?"#7dd3fc":"#1d4ed8"), borderColor:gridLine, borderTopColor: pdfDL==="saved" ? "#22c55e" : accentClr }}>
                  {pdfDL==="saved" ? "✓ PDF Exported" : "Exporting PDF…"}
                </div>
              </>
            ) : isPdfExcel ? (
              <>
                <div className="px-2.5 py-[3px] text-[8px] border-r cursor-pointer select-none"
                  style={{ color: dk?"#5a6a85":"#9ca3af", borderColor:gridLine }}>Q1_report.pdf</div>
                <div className="px-2.5 py-[3px] text-[8px] font-semibold border-r border-t-2 select-none"
                  style={{ background: dk?"#0a1120":"#fff", color: dk?"#86efac":"#15803d", borderColor:gridLine, borderTopColor:"#22c55e" }}>
                  PDF_Import ✓
                </div>
              </>
            ) : (
              <>
                <div className="px-2.5 py-[3px] text-[8px] font-medium border-r border-t-2 select-none"
                  style={{ background: dk?"#0a1120":"#fff", color: dk?"#7dd3fc":"#1d4ed8", borderColor:gridLine, borderTopColor:accentClr }}>
                  Feuil1
                </div>
                <div className="px-2.5 py-[3px] text-[8px] border-r cursor-pointer select-none"
                  style={{ color: dk?"#5a6a85":"#9ca3af", borderColor:gridLine }}>Sheet2</div>
                <div className="px-2 py-[3px] text-[10px] cursor-pointer select-none"
                  style={{ color: dk?"#5a6a85":"#9ca3af" }}>＋</div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Floating metric badge ── */}
      <div
        className={["absolute -bottom-5 -left-4 md:-left-6 rounded-2xl px-5 py-3.5 border",
          dk ? "bg-[#0c1525]/90 border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
             : "bg-white/90 border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"].join(" ")}
        style={{ backdropFilter:"blur(6px)" }}
      >
        <div className="flex items-center gap-3">
          <div className={["w-9 h-9 rounded-xl flex items-center justify-center", dk ? "bg-sky-500/[0.15]" : "bg-sky-50"].join(" ")}>
            <Clock className={["w-4 h-4", dk ? "text-sky-400" : "text-sky-500"].join(" ")} />
          </div>
          <div>
            <p className={["text-[10px] font-medium", dk ? "text-gray-500" : "text-gray-400"].join(" ")}>Hours saved / week</p>
            <p className={["text-[18px] font-bold tracking-tight leading-none mt-0.5", dk ? "text-white" : "text-gray-900"].join(" ")}>+12h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
