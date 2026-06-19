import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BarChart3,
  Brush,
  CheckCircle2,
  CircleAlert,
  Clock3,
  HelpCircle,
  Info,
  ListTodo,
  RefreshCw,
  RotateCw,
  Sparkles,
  Tag,
  UserRound,
  X,
} from "lucide-react";

const TRELLO_APP_KEY =
  import.meta.env.VITE_TRELLO_APP_KEY || "YOUR_TRELLO_APP_KEY";

function trelloFetch(path, token) {
  const base = "https://api.trello.com/1";
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${base}${path}${sep}key=${TRELLO_APP_KEY}&token=${token}`).then(
    (r) => r.json(),
  );
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function computeHealth(cards) {
  if (!cards.length) return 100;
  const stale = cards.filter((c) => daysSince(c.dateLastActivity) >= 30).length;
  const atRisk = cards.filter((c) => {
    const d = daysSince(c.dateLastActivity);
    return d >= 21 && d < 30;
  }).length;
  return Math.max(0, Math.round(100 - stale * 4 - atRisk * 1.5));
}

function CircleProgress({
  value,
  max = 100,
  size = 104,
  stroke = 10,
  color = "#22c55e",
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / max) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#ffffff12"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function DonutTotal({ fresh, aging, atRisk, stale, total }) {
  const segments = [
    { value: fresh, color: "#22c55e" },
    { value: aging, color: "#facc15" },
    { value: atRisk, color: "#f97316" },
    { value: stale, color: "#ef4444" },
  ];
  let offset = 25;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="-rotate-90" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#ffffff10"
          strokeWidth="7"
        />
        {segments.map((segment, index) => {
          const dash = total ? (segment.value / total) * 100 : 0;
          const circle = (
            <circle
              key={index}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="7"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
            />
          );
          offset -= dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-white">
          {total}
        </span>
        <span className="text-[11px] text-slate-300">Total Cards</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, count, sub, color, border }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1724] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {createElement(Icon, { size: 17 })}
        </span>
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none" style={{ color }}>
        {count}
      </div>
      <div className="mt-1 text-xs text-slate-300">{sub}</div>
      <button
        type="button"
        className="mt-3 flex h-7 w-full items-center justify-center gap-2 rounded-md border bg-transparent text-xs font-medium transition hover:bg-white/5"
        style={{ borderColor: border, color }}
      >
        View All <ArrowRight size={13} />
      </button>
    </div>
  );
}

function AgeBar({ label, color, count, max }) {
  return (
    <div className="grid grid-cols-[150px_1fr_38px] items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="h-3 w-3 rounded-full" style={{ background: color }} />
        {label}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            background: color,
            width: `${Math.min(100, (count / max) * 100)}%`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <div className="text-right text-sm tabular-nums text-slate-300">
        {count}
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, value, label, sub, color }) {
  return (
    <div className="summary-item flex flex-col items-center border-r border-white/10 px-4 text-center last:border-r-0">
      <div className="flex items-center gap-2">
        {createElement(Icon, { size: 24, style: { color } })}
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="mt-1 text-sm text-white">{label}</div>
      <div className="text-xs text-slate-400">{sub}</div>
      <button
        type="button"
        className="mt-2 flex items-center gap-1 bg-transparent p-0 text-xs font-medium"
        style={{ color }}
      >
        View All <ArrowRight size={13} />
      </button>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, color }) {
  return (
    <button
      type="button"
      className="flex min-h-12 items-center justify-between rounded-md border border-white/10 bg-[#111a28] px-3 text-left transition hover:border-white/20 hover:bg-[#162236]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {createElement(Icon, { size: 15 })}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-white">
            {label}
          </span>
          <span className="block truncate text-[11px] text-slate-400">
            {sub}
          </span>
        </span>
      </span>
      <ArrowRight className="shrink-0 text-slate-400" size={13} />
    </button>
  );
}

export default function DeclutterPopup({ onClose, token: propToken }) {
  const token = propToken || localStorage.getItem("trello_token") || "DEMO";
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("2 mins ago");
  const [healthScore, setHealthScore] = useState(84);
  const [staleRule, setStaleRule] = useState(30);
  const [sweepAction, setSweepAction] = useState("move");
  const [autoSweep, setAutoSweep] = useState(true);
  const [sweepFreq, setSweepFreq] = useState("Daily");
  const [cards, setCards] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const demoCards = useMemo(
    () =>
      Array.from({ length: 245 }, (_, i) => ({
        id: String(i),
        name: `Card ${i}`,
        dateLastActivity: new Date(
          Date.now() - (i % 50) * 86_400_000,
        ).toISOString(),
        idMembers: i % 35 < 7 ? [] : ["member1"],
      })),
    [],
  );

  const DEMO = token === "DEMO" || TRELLO_APP_KEY === "YOUR_TRELLO_APP_KEY";

  const loadData = useCallback(async (refetch = false) => {
    if (refetch) setRefreshing(true);
    else setLoading(true);

    let allCards = demoCards;
    if (!DEMO) {
      try {
        const boards = await trelloFetch(
          "/members/me/boards?filter=open&fields=id",
          token,
        );
        const cardArrays = await Promise.all(
          boards
            .slice(0, 5)
            .map((b) =>
              trelloFetch(
                `/boards/${b.id}/cards/open?fields=id,name,dateLastActivity,idMembers`,
                token,
              ),
            ),
        );
        allCards = cardArrays.flat();
      } catch {
        allCards = demoCards;
      }
    }

    setCards(allCards);
    setHealthScore(computeHealth(allCards));
    setLastUpdated(refetch ? "just now" : "2 mins ago");
    setLoading(false);
    setRefreshing(false);
  }, [DEMO, demoCards, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stale = cards.filter((c) => daysSince(c.dateLastActivity) >= staleRule);
  const atRisk = cards.filter((c) => {
    const d = daysSince(c.dateLastActivity);
    return d >= staleRule - 9 && d < staleRule;
  });
  const unassigned = cards.filter((c) => c.idMembers?.length === 0);
  const fresh = cards.filter((c) => daysSince(c.dateLastActivity) <= 7);
  const aging = cards.filter((c) => {
    const d = daysSince(c.dateLastActivity);
    return d >= 8 && d <= 20;
  });
  const maxAge = Math.max(fresh.length, aging.length, atRisk.length, stale.length, 1);
  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#facc15" : "#ef4444";
  const healthLabel =
    healthScore >= 80
      ? "Your board is in good health"
      : healthScore >= 60
        ? "Your board needs attention"
        : "Your board needs cleanup";

  async function handleSweep() {
    setSweeping(true);
    await new Promise((r) => setTimeout(r, 900));
    setSweeping(false);
    await loadData(true);
  }

  if (loading) {
    return (
      <div className="flex h-[min(620px,calc(100vh-32px))] w-full max-w-[760px] items-center justify-center rounded-lg border border-white/10 bg-[#050a11] shadow-2xl">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-h-[min(620px,calc(100vh-32px))] w-[min(760px,calc(100vw-24px))] overflow-hidden rounded-lg border border-white/10 bg-[#050a11] text-left text-slate-200 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Brush size={22} />
          </div>
          <div>
            <div className="text-xl font-bold leading-5 text-white">
              Declutter
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Stale Card Manager for Trello
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            className="flex items-center gap-2 rounded-md bg-transparent px-2 py-1 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <div className="h-6 w-px bg-white/10" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-transparent p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="h-[calc(min(620px,calc(100vh-32px))-65px)] overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-3">
          <section className="rounded-lg border border-white/10 bg-[#0b1320] p-6">
            <div className="health-grid grid grid-cols-[120px_minmax(0,1fr)_170px] items-center gap-6">
              <div className="relative h-[104px] w-[104px]">
                <CircleProgress value={healthScore} color={healthColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold leading-none" style={{ color: healthColor }}>
                    {healthScore}
                  </span>
                  <span className="text-sm text-slate-300">/100</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Board Health Score
                </h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                  {healthLabel} <CheckCircle2 size={15} />
                </div>
                <div className="mt-7 text-xs text-slate-400">
                  Last updated: {lastUpdated}
                </div>
              </div>
              <div className="text-right">
                <svg viewBox="0 0 150 70" className="h-20 w-full">
                  <defs>
                    <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e66" />
                      <stop offset="100%" stopColor="#22c55e00" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 48 L38 35 L64 42 L90 24 L114 36 L138 14 L138 64 L12 64 Z"
                    fill="url(#sparkFill)"
                  />
                  <polyline
                    points="12,48 38,35 64,42 90,24 114,36 138,14"
                    fill="none"
                    stroke="#22c55e"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                  {[12, 38, 64, 90, 114, 138].map((x, i) => {
                    const y = [48, 35, 42, 24, 36, 14][i];
                    return <circle key={x} cx={x} cy={y} r="4" fill="#22c55e" />;
                  })}
                </svg>
                <div className="text-xs text-slate-300">
                  Trend (7 days): <span className="text-green-400">↑ 6</span>
                </div>
              </div>
            </div>
          </section>

          <div className="stats-grid grid grid-cols-3 gap-3">
            <StatCard
              icon={CircleAlert}
              label="Stale Cards"
              count={stale.length}
              sub="Need immediate action"
              color="#ef4444"
              border="#ef444480"
            />
            <StatCard
              icon={AlertTriangle}
              label="At Risk Cards"
              count={atRisk.length}
              sub="May become stale soon"
              color="#f59e0b"
              border="#f59e0b80"
            />
            <StatCard
              icon={UserRound}
              label="Unassigned Cards"
              count={unassigned.length}
              sub="No members assigned"
              color="#a855f7"
              border="#a855f780"
            />
          </div>

          <section className="rounded-lg border border-white/10 bg-[#0b1320] p-4">
            <h2 className="mb-4 text-base font-bold text-white">
              Aging Distribution
            </h2>
            <div className="aging-flex flex items-center gap-7">
              <div className="flex-1 space-y-4">
                <AgeBar label="Fresh (0-7 days)" color="#22c55e" count={fresh.length} max={maxAge} />
                <AgeBar label="Aging (8-20 days)" color="#facc15" count={aging.length} max={maxAge} />
                <AgeBar label="At Risk (21-29 days)" color="#f97316" count={atRisk.length} max={maxAge} />
                <AgeBar label="Stale (30+ days)" color="#ef4444" count={stale.length} max={maxAge} />
              </div>
              <DonutTotal
                fresh={fresh.length}
                aging={aging.length}
                atRisk={atRisk.length}
                stale={stale.length}
                total={cards.length}
              />
            </div>
          </section>

          <section className="rules-grid grid grid-cols-[1fr_1.15fr_1fr] rounded-lg border border-white/10 bg-[#0b1320] p-4">
            <div className="rule-section border-r border-white/10 pr-5">
              <h2 className="text-base font-bold text-white">Sweep Rules</h2>
              <label className="mt-4 block text-xs text-slate-300">
                Days before a card is considered stale
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  value={staleRule}
                  min={1}
                  max={365}
                  onChange={(e) =>
                    setStaleRule(Math.max(1, Number(e.target.value)))
                  }
                  className="h-9 w-24 rounded-md border border-white/10 bg-[#07101b] px-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <span className="text-sm text-slate-300">days</span>
              </div>
            </div>

            <div className="rule-section border-r border-white/10 px-5">
              <div className="mb-3 text-xs text-slate-300">
                When a card becomes stale
              </div>
              <div className="space-y-2">
                {[
                  { val: "move", label: "Move to Stale List", icon: ListTodo },
                  { val: "archive", label: "Archive Card", icon: Archive },
                  { val: "label", label: "Add Label", icon: Tag },
                  { val: "moveto", label: "Move to Another List", icon: ArrowRight },
                ].map(({ val, label, icon: Icon }) => (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-200"
                  >
                    <input
                      type="radio"
                      name="sweepAction"
                      value={val}
                      checked={sweepAction === val}
                      onChange={() => setSweepAction(val)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {createElement(Icon, {
                      size: 14,
                      className: "text-slate-400",
                    })}
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rule-section pl-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={autoSweep}
                  onChange={(e) => setAutoSweep(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Auto Sweep Enabled
              </label>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Automatically apply the rule on schedule.
              </p>
              <label className="mt-5 block text-xs text-slate-300">
                Sweep Frequency
              </label>
              <select
                value={sweepFreq}
                onChange={(e) => setSweepFreq(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border border-white/10 bg-[#07101b] px-3 text-sm text-white outline-none focus:border-blue-500"
              >
                {["Hourly", "Daily", "Weekly", "Monthly"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b1320] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Weekly Cleanup Summary
              </h2>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-blue-500/70 bg-transparent px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10"
              >
                View Full Summary <ArrowRight size={13} />
              </button>
            </div>
            <div className="summary-grid grid grid-cols-3">
              <SummaryItem
                icon={CheckCircle2}
                value={8}
                label="Cards Swept"
                sub="Automatically moved"
                color="#22c55e"
              />
              <SummaryItem
                icon={RotateCw}
                value={3}
                label="Cards Revived"
                sub="Stale cards made active again"
                color="#3b82f6"
              />
              <SummaryItem
                icon={Clock3}
                value={12}
                label="Became Stale"
                sub="Newly crossed stale threshold"
                color="#f59e0b"
              />
            </div>
          </section>

          <button
            type="button"
            onClick={handleSweep}
            disabled={sweeping || stale.length === 0}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-md bg-blue-600 text-base font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sweeping ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Brush size={18} />
            )}
            Sweep {stale.length} Stale Card{stale.length === 1 ? "" : "s"}
          </button>
          <p className="-mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Info size={14} /> Stale cards will be processed based on the rule above.
          </p>

          <section className="rounded-lg border border-white/10 bg-[#0b1320] p-4">
            <h2 className="mb-3 text-sm font-bold text-white">Quick Actions</h2>
            <div className="quick-grid grid grid-cols-4 gap-3">
              <QuickAction icon={CircleAlert} label="View Stale Cards" sub={`${stale.length} cards`} color="#ef4444" />
              <QuickAction icon={AlertTriangle} label="View At Risk Cards" sub={`${atRisk.length} cards`} color="#f59e0b" />
              <QuickAction icon={UserRound} label="View Unassigned Cards" sub={`${unassigned.length} cards`} color="#a855f7" />
              <QuickAction icon={BarChart3} label="View Cleanup Summary" sub="This week" color="#3b82f6" />
            </div>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <Sparkles size={14} /> Powering cleaner, healthier boards
        </span>
        <button
          type="button"
          className="flex items-center gap-2 bg-transparent p-0 text-xs text-slate-400 hover:text-white"
        >
          Need help? <HelpCircle size={14} />
        </button>
      </div>
    </div>
  );
}
