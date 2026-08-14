import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------------------------------------------------------
   THE LONG FIELD
   A ten-year survey toward one destination: land, cleared
   and paid for. Every milestone is a stake driven into the
   timeline. Every check-in is a season worked.
--------------------------------------------------------- */

const BIRTH_YEAR = 1996; // for age display only

const DEFAULT_MILESTONES = [
  {
    id: "m1",
    phase: "Foundation",
    title: "Stabilize — survive Aug–Oct on base pay",
    targetYear: 2026,
    tasks: [
      "COA base pay covers rent stipulation through Nov",
      "Landlord shortfall + utilities caught up",
      "No new debt taken on",
    ],
  },
  {
    id: "m2",
    phase: "Foundation",
    title: "Debt resolution — charge-offs settled, Chase resolved",
    targetYear: 2027,
    tasks: [
      "Credit One paid in full",
      "BofA settled (~$6,600 target)",
      "Discover settled (~$6,200 target)",
      "Chase litigation resolved (settlement or dismissal)",
    ],
  },
  {
    id: "m3",
    phase: "Foundation",
    title: "FHA-ready — credit rebuilt, cushion built",
    targetYear: 2028,
    tasks: [
      "12+ months clean history post-settlement",
      "3-month emergency fund saved",
      "Dad paid back in full",
    ],
  },
  {
    id: "m4",
    phase: "Build",
    title: "Property #1 — FHA multi-unit house hack",
    targetYear: 2029,
    tasks: [
      "Duplex or fourplex purchased, 3.5% down",
      "Live in one unit, others rented",
      "Self-manage for a full year before hiring help",
    ],
  },
  {
    id: "m5",
    phase: "Build",
    title: "First business — laundromat (SBA)",
    targetYear: 2031,
    tasks: [
      "Property #1 stable for 12+ months first",
      "SBA loan qualified and closed",
      "Self-run for a year, then hand to a manager",
    ],
  },
  {
    id: "m6",
    phase: "Land",
    title: "Land fund reached (~$95k for 100 acres, financed)",
    targetYear: 2033,
    tasks: [
      "Laundromat cash flow redirected to land fund",
      "Down payment + closing costs saved",
    ],
  },
  {
    id: "m7",
    phase: "Land",
    title: "Land acquired — infrastructure begins",
    targetYear: 2034,
    tasks: [
      "100 acres closed, financed",
      "Well, septic, road access started",
      "Starter structure planned",
    ],
  },
];

const PHASE_ORDER = ["Foundation", "Build", "Land"];

const REINFORCE = [
  { min: 0, text: "The first stake is the hardest to drive. You've already started." },
  { min: 15, text: "Ground's broken. This is where most people quit — you didn't." },
  { min: 35, text: "A third of the way through the foundation years. That's real weight moved." },
  { min: 55, text: "Past the midpoint. What's ahead is building on solid ground, not digging out of a hole." },
  { min: 75, text: "The land is close enough to smell now. Keep the discipline that got you here." },
  { min: 95, text: "Almost home. Don't ease up on the last stretch." },
  { min: 100, text: "The field is yours. Everything after this is building." },
];

function useStorage(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(key, false);
        if (!cancelled && res && res.value) {
          setValue(JSON.parse(res.value));
        }
      } catch (e) {
        // no existing value yet — fine
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  const persist = useCallback(
    async (next) => {
      setValue(next);
      try {
        await window.storage.set(key, JSON.stringify(next), false);
      } catch (e) {
        console.error("storage save failed", e);
      }
    },
    [key]
  );

  return [value, persist, loaded];
}

function ageInYear(year) {
  return year - BIRTH_YEAR;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function TheLongField() {
  const [milestones, setMilestones, milestonesLoaded] = useStorage(
    "long-field:milestones",
    DEFAULT_MILESTONES.map((m) => ({
      ...m,
      done: m.tasks.map(() => false),
      notes: "",
    }))
  );
  const [checkIns, setCheckIns, checkInsLoaded] = useStorage("long-field:checkins", []);
  const [noteDraft, setNoteDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newPhase, setNewPhase] = useState("Build");
  const [expanded, setExpanded] = useState(null);

  const loaded = milestonesLoaded && checkInsLoaded;

  const totalTasks = useMemo(
    () => milestones.reduce((sum, m) => sum + m.tasks.length, 0),
    [milestones]
  );
  const doneTasks = useMemo(
    () =>
      milestones.reduce(
        (sum, m) => sum + (m.done ? m.done.filter(Boolean).length : 0),
        0
      ),
    [milestones]
  );
  const pct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const reinforcement = useMemo(() => {
    let msg = REINFORCE[0].text;
    for (const r of REINFORCE) {
      if (pct >= r.min) msg = r.text;
    }
    return msg;
  }, [pct]);

  const streak = useMemo(() => {
    if (!checkIns.length) return 0;
    const months = new Set(checkIns.map((c) => c.month));
    let count = 0;
    let cursor = new Date();
    while (true) {
      const key = monthKey(cursor);
      if (months.has(key)) {
        count += 1;
        cursor.setMonth(cursor.getMonth() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [checkIns]);

  const thisMonthKey = monthKey(new Date());
  const checkedInThisMonth = checkIns.some((c) => c.month === thisMonthKey);

  function toggleTask(mId, idx) {
    const next = milestones.map((m) => {
      if (m.id !== mId) return m;
      const done = [...m.done];
      done[idx] = !done[idx];
      return { ...m, done };
    });
    setMilestones(next);
  }

  function updateNotes(mId, text) {
    const next = milestones.map((m) => (m.id === mId ? { ...m, notes: text } : m));
    setMilestones(next);
  }

  function logCheckIn() {
    const entry = {
      month: thisMonthKey,
      date: new Date().toISOString(),
      note: noteDraft.trim(),
      pctAtTime: pct,
    };
    setCheckIns([entry, ...checkIns]);
    setNoteDraft("");
  }

  function addMilestone() {
    if (!newTitle.trim() || !newYear) return;
    const id = "custom-" + Date.now();
    const next = [
      ...milestones,
      {
        id,
        phase: newPhase,
        title: newTitle.trim(),
        targetYear: parseInt(newYear, 10),
        tasks: ["Define first step"],
        done: [false],
        notes: "",
      },
    ];
    setMilestones(next);
    setNewTitle("");
    setNewYear("");
    setAddOpen(false);
  }

  function milestoneStatus(m) {
    const total = m.tasks.length;
    const done = m.done ? m.done.filter(Boolean).length : 0;
    if (done === 0) return "open";
    if (done === total) return "complete";
    return "progress";
  }

  if (!loaded) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>surveying the field…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{FONT_IMPORTS}</style>

      <header style={styles.header}>
        <div style={styles.eyebrow}>A TEN-YEAR SURVEY · STARTED 2026</div>
        <h1 style={styles.h1}>The Long Field</h1>
        <p style={styles.sub}>
          Every stake below is a milestone between here and the land. Age {ageInYear(2026)}{" "}
          now — land targeted around age {ageInYear(2034)}.
        </p>
      </header>

      {/* Progress rail */}
      <section style={styles.progressCard}>
        <div style={styles.progressTop}>
          <span style={styles.progressLabel}>ACRES SECURED</span>
          <span style={styles.progressPct}>{pct}%</span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${pct}%`,
            }}
          />
        </div>
        <p style={styles.reinforceText}>{reinforcement}</p>
      </section>

      {/* Check-in */}
      <section style={styles.checkinCard}>
        <div style={styles.checkinHeader}>
          <div>
            <div style={styles.cardTitle}>Monthly check-in</div>
            <div style={styles.streakText}>
              {streak > 0
                ? `${streak} month${streak === 1 ? "" : "s"} running`
                : "no streak yet — start this month"}
            </div>
          </div>
          {checkedInThisMonth && <span style={styles.doneBadge}>logged</span>}
        </div>
        {!checkedInThisMonth ? (
          <>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Where do things actually stand this month? Debt, savings, setbacks — be honest."
              style={styles.textarea}
              rows={3}
            />
            <button style={styles.primaryBtn} onClick={logCheckIn}>
              Log this month
            </button>
          </>
        ) : (
          <p style={styles.checkedInNote}>
            "{checkIns.find((c) => c.month === thisMonthKey)?.note || "(no note)"}"
          </p>
        )}
      </section>

      {/* Timeline */}
      <section>
        {PHASE_ORDER.map((phase) => {
          const items = milestones.filter((m) => m.phase === phase);
          if (!items.length) return null;
          return (
            <div key={phase} style={styles.phaseBlock}>
              <div style={styles.phaseLabel}>{phase.toUpperCase()}</div>
              <div style={styles.rail}>
                {items
                  .sort((a, b) => a.targetYear - b.targetYear)
                  .map((m) => {
                    const status = milestoneStatus(m);
                    const isOpen = expanded === m.id;
                    return (
                      <div key={m.id} style={styles.stakeRow}>
                        <div style={styles.stakeCol}>
                          <div
                            style={{
                              ...styles.stakeDot,
                              ...(status === "complete"
                                ? styles.stakeDotDone
                                : status === "progress"
                                ? styles.stakeDotProgress
                                : {}),
                            }}
                          />
                          <div style={styles.stakeLine} />
                        </div>
                        <div style={styles.milestoneCard}>
                          <button
                            style={styles.milestoneHeader}
                            onClick={() => setExpanded(isOpen ? null : m.id)}
                          >
                            <div>
                              <div style={styles.milestoneYear}>
                                {m.targetYear} · age {ageInYear(m.targetYear)}
                              </div>
                              <div style={styles.milestoneTitle}>{m.title}</div>
                            </div>
                            <span style={styles.chevron}>{isOpen ? "–" : "+"}</span>
                          </button>
                          {isOpen && (
                            <div style={styles.milestoneBody}>
                              {m.tasks.map((t, idx) => (
                                <label key={idx} style={styles.taskRow}>
                                  <input
                                    type="checkbox"
                                    checked={!!(m.done && m.done[idx])}
                                    onChange={() => toggleTask(m.id, idx)}
                                    style={styles.checkbox}
                                  />
                                  <span
                                    style={{
                                      ...styles.taskText,
                                      ...(m.done && m.done[idx]
                                        ? styles.taskTextDone
                                        : {}),
                                    }}
                                  >
                                    {t}
                                  </span>
                                </label>
                              ))}
                              <textarea
                                value={m.notes}
                                onChange={(e) => updateNotes(m.id, e.target.value)}
                                placeholder="Notes on this milestone…"
                                style={styles.notesArea}
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Add milestone */}
      <section style={styles.addSection}>
        {!addOpen ? (
          <button style={styles.ghostBtn} onClick={() => setAddOpen(true)}>
            + Add a milestone
          </button>
        ) : (
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="Milestone title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div style={styles.addRow}>
              <input
                style={{ ...styles.input, width: 100 }}
                placeholder="Year"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value.replace(/\D/g, ""))}
              />
              <select
                style={styles.select}
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
              >
                {PHASE_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.addRow}>
              <button style={styles.primaryBtn} onClick={addMilestone}>
                Save
              </button>
              <button style={styles.ghostBtn} onClick={() => setAddOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        Saved automatically on this device. Add this page to your home screen for
        one-tap access.
      </footer>
    </div>
  );
}

const FONT_IMPORTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
`;

const COLORS = {
  bg: "#141F1A",
  surface: "#1C2921",
  surfaceRaised: "#22322A",
  parchment: "#EDE6D3",
  parchmentDim: "#B9C0B2",
  brass: "#B8904F",
  brassBright: "#D4AC6E",
  sage: "#7C9473",
  rust: "#9B5142",
  line: "#33463A",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.parchment,
    fontFamily: "'Inter', sans-serif",
    padding: "28px 18px 60px",
    maxWidth: 640,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  loadingText: {
    color: COLORS.parchmentDim,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
    paddingTop: 40,
    textAlign: "center",
  },
  header: { marginBottom: 28 },
  eyebrow: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    color: COLORS.brassBright,
    marginBottom: 10,
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 600,
    fontSize: 40,
    lineHeight: 1.05,
    margin: "0 0 10px",
    color: COLORS.parchment,
  },
  sub: {
    fontSize: 14.5,
    lineHeight: 1.55,
    color: COLORS.parchmentDim,
    margin: 0,
    maxWidth: 480,
  },
  progressCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 10,
    padding: "18px 20px",
    marginBottom: 20,
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.1em",
    color: COLORS.parchmentDim,
  },
  progressPct: {
    fontFamily: "'Fraunces', serif",
    fontSize: 24,
    fontWeight: 600,
    color: COLORS.brassBright,
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    background: "#0F1712",
    overflow: "hidden",
    border: `1px solid ${COLORS.line}`,
  },
  progressFill: {
    height: "100%",
    background: `linear-gradient(90deg, #5C4425, ${COLORS.brass}, ${COLORS.sage})`,
    transition: "width 0.4s ease",
  },
  reinforceText: {
    marginTop: 12,
    marginBottom: 0,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: COLORS.parchment,
    fontStyle: "italic",
  },
  checkinCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 10,
    padding: "18px 20px",
    marginBottom: 30,
  },
  checkinHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 17,
    fontWeight: 600,
    color: COLORS.parchment,
  },
  streakText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11.5,
    color: COLORS.brassBright,
    marginTop: 4,
  },
  doneBadge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10.5,
    color: COLORS.sage,
    border: `1px solid ${COLORS.sage}`,
    borderRadius: 20,
    padding: "3px 10px",
    height: "fit-content",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0F1712",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    color: COLORS.parchment,
    padding: "10px 12px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13.5,
    resize: "vertical",
    marginBottom: 10,
  },
  checkedInNote: {
    fontSize: 13.5,
    color: COLORS.parchmentDim,
    fontStyle: "italic",
    lineHeight: 1.5,
    margin: 0,
  },
  primaryBtn: {
    background: COLORS.brass,
    color: "#14201A",
    border: "none",
    borderRadius: 7,
    padding: "9px 18px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
  },
  ghostBtn: {
    background: "transparent",
    color: COLORS.brassBright,
    border: `1px solid ${COLORS.brass}`,
    borderRadius: 7,
    padding: "9px 18px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: 13.5,
    cursor: "pointer",
  },
  phaseBlock: { marginBottom: 24 },
  phaseLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11.5,
    letterSpacing: "0.14em",
    color: COLORS.parchmentDim,
    marginBottom: 12,
    paddingLeft: 2,
  },
  rail: { display: "flex", flexDirection: "column" },
  stakeRow: { display: "flex", gap: 12 },
  stakeCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 16,
    flexShrink: 0,
  },
  stakeDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: COLORS.bg,
    border: `2px solid ${COLORS.line}`,
    marginTop: 20,
    flexShrink: 0,
  },
  stakeDotProgress: {
    borderColor: COLORS.brass,
    background: COLORS.brass,
  },
  stakeDotDone: {
    borderColor: COLORS.sage,
    background: COLORS.sage,
  },
  stakeLine: {
    width: 2,
    flex: 1,
    background: COLORS.line,
    marginTop: 4,
  },
  milestoneCard: {
    flex: 1,
    marginBottom: 14,
  },
  milestoneHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    background: COLORS.surface,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 9,
    padding: "13px 16px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  milestoneYear: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: COLORS.brassBright,
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 14.5,
    fontWeight: 500,
    color: COLORS.parchment,
    lineHeight: 1.4,
  },
  chevron: {
    color: COLORS.parchmentDim,
    fontSize: 18,
    lineHeight: 1,
    marginLeft: 10,
  },
  milestoneBody: {
    background: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.line}`,
    borderTop: "none",
    borderRadius: "0 0 9px 9px",
    padding: "10px 16px 16px",
    marginTop: -1,
  },
  taskRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    padding: "7px 0",
    cursor: "pointer",
  },
  checkbox: { marginTop: 3, accentColor: COLORS.brass },
  taskText: { fontSize: 13.5, lineHeight: 1.4, color: COLORS.parchment },
  taskTextDone: {
    color: COLORS.parchmentDim,
    textDecoration: "line-through",
  },
  notesArea: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0F1712",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    color: COLORS.parchment,
    padding: "8px 10px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    marginTop: 8,
    resize: "vertical",
  },
  addSection: { marginTop: 10, marginBottom: 20 },
  addForm: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 9,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  addRow: { display: "flex", gap: 10 },
  input: {
    flex: 1,
    background: "#0F1712",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    color: COLORS.parchment,
    padding: "9px 11px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13.5,
    boxSizing: "border-box",
  },
  select: {
    background: "#0F1712",
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    color: COLORS.parchment,
    padding: "9px 11px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13.5,
  },
  footer: {
    textAlign: "center",
    fontSize: 11.5,
    color: COLORS.parchmentDim,
    marginTop: 30,
    fontFamily: "'IBM Plex Mono', monospace",
  },
};
