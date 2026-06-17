import { useState, useEffect } from "react";

const TRELLO_APP_KEY =
  import.meta.env.VITE_TRELLO_APP_KEY || "YOUR_TRELLO_APP_KEY";

// ── helpers ────────────────────────────────────────────────────────────────────

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
  const score = Math.max(0, 100 - stale * 4 - atRisk * 1.5);
  return Math.round(score);
}

// ── sub-components ─────────────────────────────────────────────────────────────

function CircleProgress({
  value,
  max = 100,
  size = 80,
  stroke = 8,
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
        stroke="#ffffff10"
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

function StatCard({ icon, label, count, sub, color, onView }) {
  return (
    <div
      className={`bg-[#1C2333] rounded-xl p-4 border border-white/5 flex flex-col gap-1`}
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{count}</div>
      <div className="text-[10px] text-gray-500">{sub}</div>
      <button
        onClick={onView}
        className={`mt-1 text-[10px] border ${color === "text-red-400" ? "border-red-500/40 text-red-400 hover:bg-red-500/10" : color === "text-yellow-400" ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" : "border-purple-500/40 text-purple-400 hover:bg-purple-500/10"} rounded-lg py-1 transition-colors`}
      >
        View All →
      </button>
    </div>
  );
}

function AgeBar({ label, color, count, max }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-32 shrink-0">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[11px] text-gray-400">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.min(100, (count / max) * 100)}%`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <span className="text-[11px] text-gray-400 w-6 text-right">{count}</span>
    </div>
  );
}

// ── main ───────────────────────────────────────────────────────────────────────

export default function DeclutterPopup({ onClose, token: propToken }) {
  const token = propToken || localStorage.getItem("trello_token") || "DEMO";

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("just now");
  const [healthScore, setHealthScore] = useState(84);
  const [healthTrend] = useState(+6);
  const [cards, setCards] = useState([]);
  const [staleRule, setStaleRule] = useState(30);
  const [sweepAction, setSweepAction] = useState("move");
  const [autoSweep, setAutoSweep] = useState(true);
  const [sweepFreq, setSweepFreq] = useState("Daily");
  const [sweeping, setSweeping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Demo data used when no real token or key
  const DEMO = token === "DEMO" || TRELLO_APP_KEY === "YOUR_TRELLO_APP_KEY";

  const demoCards = Array.from({ length: 245 }, (_, i) => ({
    id: String(i),
    name: `Card ${i}`,
    dateLastActivity: new Date(
      Date.now() - (i % 50) * 86_400_000,
    ).toISOString(),
    idMembers: i % 8 === 0 ? [] : ["member1"],
  }));

  async function loadData(refetch = false) {
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
            .slice(0, 3)
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
    setLastUpdated("just now");
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

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

  const maxAge = Math.max(
    fresh.length,
    aging.length,
    atRisk.length,
    stale.length,
    1,
  );

  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#eab308" : "#ef4444";
  const healthLabel =
    healthScore >= 80
      ? "good health"
      : healthScore >= 60
        ? "fair health"
        : "poor health";
  const healthEmoji =
    healthScore >= 80 ? "✅" : healthScore >= 60 ? "⚠️" : "🔴";

  async function handleSweep() {
    setSweeping(true);
    await new Promise((r) => setTimeout(r, 1800)); // simulate API call
    setSweeping(false);
    await loadData(true);
  }

  if (loading) {
    return (
      <div className="w-[380px] bg-[#0D1117] rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading board data…</p>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#0D1117] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h12M3 18h8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="19" cy="17" r="3" fill="#4ADE80" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">
              Declutter
            </div>
            <div className="text-gray-500 text-[10px]">
              Stale Card Manager for Trello
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            className="text-gray-400 hover:text-white transition-colors text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
            disabled={refreshing}
          >
            <span className={refreshing ? "animate-spin inline-block" : ""}>
              ↻
            </span>
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4 scrollbar-thin">
        {/* Board Health Score */}
        <div className="bg-[#1C2333] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-4">
            {/* Circle */}
            <div className="relative shrink-0">
              <CircleProgress value={healthScore} color={healthColor} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-xl leading-none">
                  {healthScore}
                </span>
                <span className="text-gray-500 text-[9px]">/100</span>
              </div>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm mb-1">
                Board Health Score
              </div>
              <div className="text-green-400 text-xs mb-1">
                {healthEmoji} Your board is in {healthLabel}
              </div>
              <div className="text-gray-500 text-[10px]">
                Last updated: {lastUpdated}
              </div>
            </div>
            {/* Trend sparkline (static SVG) */}
            <div className="text-right shrink-0">
              <svg width="56" height="28" viewBox="0 0 56 28">
                <polyline
                  points="0,22 10,18 20,20 30,14 40,10 56,6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[0, 10, 20, 30, 40, 56].map((x, i) => {
                  const ys = [22, 18, 20, 14, 10, 6];
                  return (
                    <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="#22c55e" />
                  );
                })}
              </svg>
              <div className="text-green-400 text-[10px] mt-1">
                Trend (7d): ↑ {healthTrend}
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon="🔴"
            label="Stale Cards"
            count={stale.length}
            sub="Need immediate action"
            color="text-red-400"
            onView={() => {}}
          />
          <StatCard
            icon="⚠️"
            label="At Risk Cards"
            count={atRisk.length}
            sub="May become stale soon"
            color="text-yellow-400"
            onView={() => {}}
          />
          <StatCard
            icon="👤"
            label="Unassigned"
            count={unassigned.length}
            sub="No members assigned"
            color="text-purple-400"
            onView={() => {}}
          />
        </div>

        {/* Aging Distribution */}
        <div className="bg-[#1C2333] rounded-xl p-4 border border-white/5">
          <div className="text-white font-semibold text-sm mb-3">
            Aging Distribution
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2.5">
              <AgeBar
                label="Fresh (0–7d)"
                color="bg-green-500"
                count={fresh.length}
                max={maxAge}
              />
              <AgeBar
                label="Aging (8–20d)"
                color="bg-yellow-400"
                count={aging.length}
                max={maxAge}
              />
              <AgeBar
                label="At Risk (21–29d)"
                color="bg-orange-500"
                count={atRisk.length}
                max={maxAge}
              />
              <AgeBar
                label="Stale (30+d)"
                color="bg-red-500"
                count={stale.length}
                max={maxAge}
              />
            </div>
            {/* Donut total */}
            <div className="relative shrink-0 w-16 h-16">
              <CircleProgress
                value={fresh.length}
                max={cards.length}
                size={64}
                stroke={7}
                color="#22c55e"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-bold text-xs leading-none">
                  {cards.length}
                </span>
                <span className="text-gray-500 text-[8px]">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sweep Rules */}
        <div className="bg-[#1C2333] rounded-xl p-4 border border-white/5">
          <div className="text-white font-semibold text-sm mb-3">
            Sweep Rules
          </div>
          <div className="flex gap-4">
            {/* Left: days input */}
            <div className="shrink-0">
              <div className="text-gray-400 text-[10px] mb-2">
                Days before stale
              </div>
              <div className="flex items-center gap-1 bg-[#0D1117] border border-white/10 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={staleRule}
                  onChange={(e) =>
                    setStaleRule(Math.max(1, Number(e.target.value)))
                  }
                  className="w-10 bg-transparent text-white text-sm font-semibold outline-none"
                  min={1}
                  max={365}
                />
                <span className="text-gray-500 text-[10px]">days</span>
              </div>
            </div>
            {/* Middle: radio actions */}
            <div className="flex-1">
              <div className="text-gray-400 text-[10px] mb-2">
                When a card becomes stale
              </div>
              <div className="space-y-1.5">
                {[
                  { val: "move", label: "Move to Stale List" },
                  { val: "archive", label: "Archive Card" },
                  { val: "label", label: "Add Label" },
                  { val: "moveto", label: "Move to Another List" },
                ].map((opt) => (
                  <label
                    key={opt.val}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sweepAction"
                      value={opt.val}
                      checked={sweepAction === opt.val}
                      onChange={() => setSweepAction(opt.val)}
                      className="accent-blue-500"
                    />
                    <span className="text-gray-300 text-[11px]">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Right: auto sweep */}
            <div className="shrink-0 w-28">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSweep}
                  onChange={(e) => setAutoSweep(e.target.checked)}
                  className="accent-blue-500 w-3.5 h-3.5"
                />
                <span className="text-blue-400 text-[10px] font-semibold">
                  Auto Sweep Enabled
                </span>
              </label>
              <p className="text-gray-500 text-[9px] mb-3 leading-relaxed">
                Automatically apply rule on schedule.
              </p>
              <div className="text-gray-400 text-[10px] mb-1">
                Sweep Frequency
              </div>
              <select
                value={sweepFreq}
                onChange={(e) => setSweepFreq(e.target.value)}
                className="w-full bg-[#0D1117] border border-white/10 text-white text-[11px] rounded-lg px-2 py-1 outline-none"
              >
                {["Hourly", "Daily", "Weekly", "Monthly"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Cleanup Summary */}
        <div className="bg-[#1C2333] rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-semibold text-sm">
              Weekly Cleanup Summary
            </div>
            <button className="text-blue-400 text-[10px] hover:text-blue-300 transition-colors">
              View Full Summary →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: "✅",
                color: "text-green-400",
                count: 8,
                label: "Cards Swept",
                sub: "Automatically moved",
              },
              {
                icon: "🔄",
                color: "text-blue-400",
                count: 3,
                label: "Cards Revived",
                sub: "Stale cards made active",
              },
              {
                icon: "🕐",
                color: "text-orange-400",
                count: 12,
                label: "Became Stale",
                sub: "Newly crossed threshold",
              },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-base">{s.icon}</span>
                  <span className={`${s.color} font-bold text-lg`}>
                    {s.count}
                  </span>
                </div>
                <div className="text-white text-[10px] font-medium">
                  {s.label}
                </div>
                <div className="text-gray-500 text-[9px]">{s.sub}</div>
                <button
                  className={`${s.color} text-[9px] mt-1 hover:underline`}
                >
                  View All →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sweep CTA */}
        <button
          onClick={handleSweep}
          disabled={sweeping || stale.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {sweeping ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sweeping cards…</span>
            </>
          ) : (
            <>
              <span>🧹</span>
              <span>
                Sweep {stale.length} Stale Card{stale.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </button>
        <p className="text-center text-gray-600 text-[10px] -mt-2">
          ℹ️ Stale cards will be processed based on the rule above.
        </p>

        {/* Quick Actions */}
        <div className="pb-1">
          <div className="text-white font-semibold text-xs mb-2">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🔴", label: "View Stale Cards", count: stale.length },
              { icon: "⚠️", label: "View At Risk Cards", count: atRisk.length },
              {
                icon: "👤",
                label: "View Unassigned Cards",
                count: unassigned.length,
              },
              {
                icon: "📊",
                label: "View Cleanup Summary",
                count: null,
                sub: "This week",
              },
            ].map((q, i) => (
              <button
                key={i}
                className="bg-[#1C2333] hover:bg-[#252D3E] border border-white/5 rounded-xl p-3 text-left transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{q.icon}</span>
                  <div>
                    <div className="text-gray-300 text-[10px] font-medium leading-tight">
                      {q.label}
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      {q.count !== null ? `${q.count} cards` : q.sub}
                    </div>
                  </div>
                </div>
                <span className="text-gray-600 text-xs">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between shrink-0">
        <span className="text-gray-600 text-[10px]">
          ✨ Powering cleaner, healthier boards
        </span>
        <button className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors">
          Need help? ⓘ
        </button>
      </div>
    </div>
  );
}
