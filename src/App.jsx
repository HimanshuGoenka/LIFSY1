import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LS_KEY = "lifsy_state_v1";

export default function LIFSYDashboard() {
  const [view, setView] = useState("overview");
  const [toast, setToast] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [compact, setCompact] = useState(false);

  // load initial state from localStorage or fallback
  const initial = readLocalState();

  const [challenge, setChallenge] = useState(initial.challenge);
  const [habits, setHabits] = useState(initial.habits);
  const [balanceHistory, setBalanceHistory] = useState(initial.balanceHistory);
  const [userProfile, setUserProfile] = useState(initial.userProfile || defaultProfile());
  const [insights] = useState([
    { id: 1, text: "Your highest success rate is morning routines. Try scheduling tougher tasks at 7 AM." },
    { id: 2, text: "Reduce nightly screen time by 30 minutes to improve sleep consistency." },
  ]);

  // Persist to localStorage whenever key pieces change
  useEffect(() => {
    const payload = { challenge, habits, balanceHistory, userProfile };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [challenge, habits, balanceHistory, userProfile]);

  // small helper to show toast
  function showToast(message, type = "info") {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }

  // Toggle habit completion for **today**. Each habit keeps a 7-item history (booleans)
  function toggleHabit(id) {
    setHabits((prev) => {
      return prev.map((h) => {
        if (h.id !== id) return h;
        const history = (h.history || []).slice();
        // treat index 6 as today (0..6, oldest..today)
        const todayIndex = history.length - 1;
        const completedToday = !!history[todayIndex];
        if (completedToday) {
          history[todayIndex] = false;
          showToast("Marked undone for today", "warning");
        } else {
          history[todayIndex] = true;
          showToast("Nice! Habit completed", "success");
        }
        const streak = computeStreakFromHistory(history);
        return { ...h, history, streak, completedToday: history[todayIndex] };
      });
    });
  }

  function simulateFailHabit(id) {
    setHabits((h) =>
      h.map((item) => (item.id === id ? { ...item, history: [false, false, false, false, false, false, false], streak: 0, completedToday: false } : item))
    );
    setChallenge((c) => ({ ...c, stakeLocked: false }));
    showToast("Oops — streak reset", "error");
  }

  // quick deposit increase for demo (animated counter)
  function addDeposit(amount = 100) {
    setChallenge((c) => ({ ...c, deposit: c.deposit + amount }));
    setBalanceHistory((bh) => {
      const copy = bh.slice();
      const last = copy.length ? copy[copy.length - 1] : 0;
      copy.push(last + amount);
      return copy.slice(-20); // keep last 20 points
    });
    showToast(`Added ₹${amount} to your pledge`, "success");
  }

  // filtered habits for search
  const filteredHabits = habits.filter((h) => h.title.toLowerCase().includes(filter.toLowerCase()));

  // keyboard shortcut: press D to toggle compact mode
  useEffect(() => {
    function onKey(e) {
      if (e.key.toLowerCase() === "d") setCompact((s) => !s);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-purple-100 to-indigo-50 font-sans text-slate-900 relative overflow-hidden`}>
      {/* Decorative colorful blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-44 -left-44 w-[700px] h-[700px] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-fuchsia-200 via-pink-200 to-indigo-200 transform-gpu rotate-12" />
        <div className="absolute -bottom-36 -right-28 w-[560px] h-[560px] rounded-full blur-2xl opacity-30 bg-gradient-to-br from-rose-100 via-violet-100 to-indigo-100 transform-gpu -rotate-6" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-8 bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-500 text-white w-12 h-12 flex items-center justify-center text-lg font-bold shadow-md">L</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600">LIFSY</h1>
              <p className="text-sm text-slate-700">Live Smarter • Stay Healthier • Earn Your Discipline</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-white/60 backdrop-blur rounded-lg py-1 px-3 border">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26M21 8l-7.89 5.26M3 16l7.89-5.26M21 16l-7.89-5.26"/></svg>
              <span className="text-sm text-slate-600 ml-2">Pilot: 78% completion</span>
            </div>

            <button onClick={() => { setView("challenge"); showToast("Jumped to Challenge", "info"); }} className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded-lg shadow hover:scale-105 transition-transform">Start Challenge</button>

            {/* Clickable profile button (opens modal) */}
            <button onClick={() => setProfileOpen(true)} title="Open profile" className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1 border hover:shadow">
              <div className="w-10 h-10 rounded-full bg-fuchsia-50 flex items-center justify-center font-semibold text-fuchsia-700">H</div>
              <div className="text-sm text-slate-700">Himanshu</div>
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className={`lg:col-span-8 space-y-6 ${compact ? "text-sm" : ""}`}>
            <nav className="flex gap-3 mb-2 items-center">
              <Tab label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
              <Tab label="Habits" active={view === "habits"} onClick={() => setView("habits")} />
              <Tab label="Challenge" active={view === "challenge"} onClick={() => setView("challenge")} />
              <Tab label="AI Coach" active={view === "ai"} onClick={() => setView("ai")} />
              <Tab label="Predict" active={view === "predict"} onClick={() => setView("predict")} />

              <div className="ml-auto flex items-center gap-2">
                <input placeholder="Search habits..." value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1 rounded-lg border text-sm" />
                <button title="Toggle compact (press D)" onClick={() => setCompact((s) => !s)} className="px-2 py-1 bg-white border rounded-lg">{compact ? "Full" : "Compact"}</button>
              </div>
            </nav>

            {view === "overview" && (
              <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
                {/* ... overview content unchanged ... */}
                <motion.div layout className="rounded-2xl bg-gradient-to-br from-white via-pink-50 to-violet-50 p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Your 21-day Challenge</h2>
                      <p className="text-sm text-slate-500 mt-1">Active — Day {challenge.day} of {challenge.totalDays}</p>
                      <div className="mt-3 text-sm text-slate-600">Pledged Stake</div>
                      <motion.div key={challenge.deposit} initial={{ scale: 0.98, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="text-3xl font-bold mt-1">₹{challenge.deposit}</motion.div>
                    </div>

                    <div className="w-1/3">
                      <ProgressCard value={(challenge.day / challenge.totalDays) * 100} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setRulesOpen(true)} className="px-4 py-2 bg-white border border-fuchsia-100 text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 transition">View Rules</button>
                    <button onClick={() => addDeposit(100)} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white rounded-lg shadow hover:scale-[1.02] transition-transform">Add ₹100</button>
                    <button onClick={() => { navigator.clipboard?.writeText("https://app.lifsy.example"); showToast("Share link copied", "info"); }} className="px-4 py-2 bg-white border rounded-lg hover:bg-slate-50 transition">Share</button>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredHabits.map((h) => (
                    <motion.div layout key={h.id} whileHover={{ y: -4 }} className={`p-4 bg-gradient-to-br from-white to-pink-50 rounded-2xl shadow-sm border hover:shadow-md transition-shadow ${h.completedToday ? "ring-2 ring-rose-200" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-slate-500">{h.title}</div>
                          <div className="text-2xl font-semibold mt-1">{h.streak} days</div>
                        </div>
                        <div className="text-xs text-slate-400">conf: {(h.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => toggleHabit(h.id)} className={`flex-1 px-3 py-2 rounded-lg shadow ${h.completedToday ? "bg-slate-200 text-slate-800" : "bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white"}`}>
                          {h.completedToday ? "Completed" : "Mark Done"}
                        </button>
                        <button onClick={() => simulateFailHabit(h.id)} className="px-3 py-2 bg-white border rounded-lg hover:bg-red-50 transition">Miss</button>
                      </div>
                      <div className="mt-3">
                        {/* small sparkline representing recent performance - uses real 7-day history */}
                        <Sparkline data={h.history || [0,0,0,0,0,0,0]} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">AI Insights</h3>
                    <button onClick={() => showToast("Insights refreshed", "info")} className="text-xs bg-white border px-2 py-1 rounded">Refresh</button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {insights.map((i) => (
                      <motion.div key={i.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i.id * 0.08 }} className="p-3 bg-gradient-to-r from-white to-indigo-50 rounded-lg border">{i.text}</motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === "habits" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-50 p-6 shadow-lg border">
                {/* ...habits content unchanged... */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Habit Builder — AI Onboarding Flow</h2>
                  <button className="text-sm text-slate-500" onClick={() => showToast("Saved preferences", "success")}>Save</button>
                </div>

                <p className="text-sm text-slate-500 mt-2">AI customizes routines using your schedule and preferences.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-lg p-4 bg-gradient-to-br from-white to-slate-50 border">
                    <h4 className="font-medium">Sample Schedule</h4>
                    <ol className="mt-3 list-decimal list-inside text-sm text-slate-600 space-y-1">
                      <li>06:00 Wake & Hydrate (5 min)</li>
                      <li>06:15 Short Workout (30 min)</li>
                      <li>07:00 Breakfast — Protein + Veg</li>
                      <li>21:30 Wind-down — No screens</li>
                    </ol>
                    <div className="mt-3 text-xs text-slate-400">AI confidence: 82%</div>
                  </div>

                  <div className="rounded-lg p-4 bg-white border shadow-sm">
                    <h4 className="font-medium">Personalization Controls</h4>
                    <div className="mt-3 space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Morning person</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Gym access</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm">Diet restrictions</span>
                        <select className="ml-2 border rounded px-2 py-1">
                          <option>None</option>
                          <option>Vegetarian</option>
                          <option>Vegan</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {habits.map((h) => (
                    <motion.div key={h.id} layout whileHover={{ scale: 1.01 }} className="p-3 rounded-lg bg-white border shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{h.title}</div>
                        <div className="text-xs text-slate-500">{h.streak} day streak • conf {(h.confidence*100).toFixed(0)}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleHabit(h.id)} className="px-3 py-1 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded">{h.completedToday ? "Done" : "Mark"}</button>
                        <button onClick={() => simulateFailHabit(h.id)} className="px-3 py-1 bg-white border rounded">Reset</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === "challenge" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-6 shadow-lg border">
                {/* ...challenge content unchanged... */}
                <h2 className="text-xl font-semibold">21-day Deposit Challenge</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-white to-slate-50 border">
                    <p className="text-sm text-slate-600">You pledged ₹{challenge.deposit} — invested in yourself!</p>
                    <div className="mt-4">
                      <ProgressBar value={(challenge.day / challenge.totalDays) * 100} />
                      <div className="mt-3 text-sm text-slate-500">Potential reward: ₹{Math.round(challenge.deposit * 1.06)}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white border shadow-sm">
                    <h4 className="font-medium">Rules</h4>
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
                      <li>Complete daily tasks to preserve stake.</li>
                      <li>Misses reduce stake by a sliding scale.</li>
                      <li>Finish 21 days to unlock reward + cashback.</li>
                    </ul>
                    <div className="mt-4">
                      <button onClick={() => { setRulesOpen(true); }} className="px-3 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded-lg">View Contract</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === "ai" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-white via-indigo-50 to-indigo-50 p-6 shadow-lg border">
                {/* ...ai coach content unchanged... */}
                <h2 className="text-xl font-semibold">AI Coach — Predictive Modeling</h2>
                <p className="text-sm text-slate-600 mt-2">We predict habit success and suggest nudge interventions.</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ModelCard title="Success Score" value={`78%`} desc="Based on prior behaviour" sparkData={habits[0]?.history || []} />
                  <ModelCard title="Best Time" value={`06:15 AM`} desc="Highest engagement window" sparkData={habits[1]?.history || []} />
                  <ModelCard title="Nudge Type" value={`Micro-commit`} desc="Short, achievable tasks" sparkData={habits[2]?.history || []} />
                </div>

                <div className="mt-4 p-4 rounded-lg bg-white border shadow-sm">
                  <h4 className="font-medium">Sample Nudge</h4>
                  <p className="text-sm text-slate-600 mt-2">"Start with a 5-min bodyweight warmup — we'll track completion and escalate to 10 minutes in 3 days."</p>
                </div>
              </motion.div>
            )}

            {/* ---------------------
                New: Predict Lifestyle view
               --------------------- */}
            {view === "predict" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-50 p-6 shadow-lg border">
                <h2 className="text-xl font-semibold">Predict Lifestyle</h2>
                <p className="text-sm text-slate-600 mt-2">Run a client-side lifestyle prediction (demo). You can also upload a small JSON model (weights) to override defaults.</p>

                <PredictLifestyle
                  userProfile={userProfile}
                  habits={habits}
                  onSaveModel={(m) => showToast("Custom model loaded", "success")}
                />
              </motion.div>
            )}
          </section>

          <aside className="lg:col-span-4 space-y-6">
            {/* User Profile Card (opens modal to edit) */}
            <UserProfileCard
              userProfile={userProfile}
              onEdit={() => setProfileOpen(true)}
            />

            <div className="rounded-2xl bg-gradient-to-br from-white to-indigo-50 p-5 shadow-lg border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Wallet & Rewards</h3>
                  <div className="mt-3 text-sm text-slate-500">Available Balance</div>
                  <div className="text-2xl font-bold">₹1,240</div>
                </div>
                <div className="text-right text-sm text-slate-600">Invested: ₹{challenge.deposit}</div>
              </div>

              <div className="mt-4">
                <InteractiveLineChart data={balanceHistory} height={140} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => showToast("Withdrew ₹200 (demo)", "success")} className="px-3 py-2 bg-white border rounded-lg hover:bg-slate-50 transition">Withdraw</button>
                <button onClick={() => addDeposit(250)} className="px-3 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white rounded-lg shadow">Add ₹250</button>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm border">
              <h4 className="text-lg font-semibold">Brand Perks</h4>
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-gradient-to-r from-white to-indigo-50 rounded-lg">Free 1-month gym voucher (Partner: FitLocal)</div>
                <div className="p-3 bg-gradient-to-r from-white to-emerald-50 rounded-lg">10% off healthy meals (Partner: GreenBite)</div>
              </div>
            </div>
          </aside>
        </main>

        {/* Contact section moved here as a full-width colourful block */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-indigo-500 text-white p-8 shadow-xl border border-white/20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-bold">Contact Us</h3>
              <p className="mt-2 text-sm opacity-90">We'd love to hear from you — questions, partnerships or feedback.</p>
            </div>

            <div>
              <div className="text-sm font-medium">Call / WhatsApp</div>
              <div className="mt-2 text-lg font-semibold">+91 70083 82702</div>
              <div className="mt-1 text-lg font-semibold">+91 93300 90831</div>
            </div>

            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="mt-2 text-lg font-semibold">lifsyorg@gmail.com</div>
              <div className="mt-3">
                <a href="mailto:lifsyorg@gmail.com" className="inline-block mt-1 px-3 py-2 bg-white/20 backdrop-blur rounded hover:bg-white/30 transition">Mail us</a>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-6 text-center text-sm text-slate-700">© {new Date().getFullYear()} LIFSY — Built with ❤️</footer>
      </div>

      {/* Modal for Rules */}
      <AnimatePresence>
        {rulesOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setRulesOpen(false)} className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }} className="relative z-10 max-w-xl w-full bg-white rounded-2xl shadow-lg p-6 border">
              <h3 className="text-lg font-semibold">Challenge Rules</h3>
              <p className="text-sm text-slate-600 mt-2">Complete daily tasks for 21 days to unlock your reward. Misses reduce stake by a sliding scale.</p>
              <ul className="mt-3 list-disc list-inside text-sm text-slate-600">
                <li>Daily completion required before 11:59 PM.</li>
                <li>2 misses allowed with partial refund.</li>
                <li>Completion unlocks reward + cashback.</li>
              </ul>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setRulesOpen(false)} className="px-3 py-2 bg-white border rounded">Close</button>
                <button onClick={() => { setRulesOpen(false); showToast("Contract accepted", "success"); }} className="px-3 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded">Accept</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setProfileOpen(false)} className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ y: 12 }} animate={{ y: 0 }} exit={{ y: 12 }} className="relative z-10 max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 border">
              <h3 className="text-lg font-semibold">Your Profile</h3>
              <p className="text-sm text-slate-600 mt-2">Edit your profile information — changes persist locally.</p>

              <div className="mt-4">
                <UserProfileForm initial={userProfile} onSave={(p) => {
                  setUserProfile(p);
                  try {
                    const raw = localStorage.getItem(LS_KEY);
                    const parsed = raw ? JSON.parse(raw) : {};
                    parsed.userProfile = p;
                    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
                  } catch (e) {}
                  showToast('Profile saved', 'success');
                  setProfileOpen(false);
                }} />
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setProfileOpen(false)} className="px-3 py-2 bg-white border rounded">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast / Snackbar */}
      <div className="fixed right-6 bottom-6 z-50">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} key={toast.id} className={`px-4 py-2 rounded-lg shadow-md ${toast.type === "success" ? "bg-rose-50 border border-rose-200" : toast.type === "error" ? "bg-red-50 border border-red-200" : "bg-white border"}`}>
              <div className="text-sm text-slate-900">{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --------------------
// Predict Lifestyle component + ML logic
// --------------------

function PredictLifestyle({ userProfile = {}, habits = [], onSaveModel = () => {} }) {
  const [customModel, setCustomModel] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // default weights (demo). Keys correspond to features used in predictLifestyle()
  const defaultModel = useMemo(() => ({
    bias: -0.2,
    age: -0.01,
    sleep6to8: 0.6,
    sleepLess6: -0.4,
    activityLow: -0.5,
    activityModerate: 0.2,
    activityHigh: 0.6,
    bmiUnderweight: -0.2,
    bmiNormal: 0.4,
    bmiOverweight: -0.3,
    bmiObese: -0.7,
    heartRate: -0.01,
    steps: 0.0002,
    habitRate: 1.2, // influence of habit completion rate (0..1)
  }), []);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        // basic validation: must be object with numeric keys
        setCustomModel(parsed);
        onSaveModel(parsed);
      } catch (err) {
        console.error(err);
        alert("Invalid JSON model");
      }
    };
    reader.readAsText(f);
  }

  function runPrediction() {
    setRunning(true);
    setTimeout(() => {
      try {
        const model = customModel || defaultModel;
        const out = predictLifestyle(userProfile, habits, model);
        setResult(out);
      } catch (err) {
        console.error(err);
        showToastGlobal("Prediction failed", "error");
      } finally {
        setRunning(false);
      }
    }, 250); // small simulated delay
  }

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 bg-white rounded-lg border shadow-sm">
          <div className="text-sm text-slate-600">Upload custom model (optional)</div>
          <div className="mt-2">
            <input type="file" accept="application/json" onChange={handleFile} />
            <div className="mt-2 text-xs text-slate-500">Upload a JSON with numeric weight fields (see defaults in UI comments).</div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border shadow-sm">
          <div className="text-sm text-slate-600">Quick info</div>
          <div className="mt-2 text-xs text-slate-500">
            Prediction uses age, sleep duration, physical activity, BMI category, heart rate, steps and recent habit completion. This is a demo client-side model for prototyping.
          </div>
        </div>
      </div>

      <div className="p-4 bg-gradient-to-br from-white to-indigo-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Profile summary</div>
            <div className="text-lg font-semibold mt-1">{userProfile.Occupation || "—"} • Age: {userProfile.Age || "—"}</div>
          </div>
          <div>
            <button onClick={runPrediction} disabled={running} className="px-3 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded">{running ? "Running..." : "Run Prediction"}</button>
          </div>
        </div>

        {result && (
          <div className="mt-4 grid gap-2">
            <div className="text-sm">Lifestyle Score</div>
            <div className="text-3xl font-bold">{Math.round(result.score)}</div>
            <div className="text-sm text-slate-600">Classification: <strong>{result.classification}</strong></div>

            <div className="mt-3">
              <h4 className="font-medium">Suggestions</h4>
              <ul className="mt-2 list-disc list-inside text-sm text-slate-600">
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="mt-3 text-xs text-slate-400">Model used: {customModel ? "Custom uploaded model" : "Default demo model"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// small helper to allow PredictLifestyle to call the same toast system (global-ish)
function showToastGlobal(message, type = "info") {
  // fallback global notification - in app we already show toasts; keep this safe for isolated usage
  // If integrated with the app-level showToast, you could pass a callback; here we use alert as fallback.
  try {
    // try using `window` event to notify app-level toasts if available
    window?.dispatchEvent?.(new CustomEvent("lifsy-toast", { detail: { message, type } }));
  } catch (e) {
    // fallback
    // eslint-disable-next-line no-alert
    alert(message);
  }
}

/**
 * predictLifestyle(userProfile, habits, model)
 * - userProfile: object from defaultProfile()
 * - habits: array of habits with `history` arrays
 * - model: weights object (bias + per-feature weights)
 *
 * returns: { score: 0..100, classification: "Good"|"Moderate"|"At-risk", suggestions: [] }
 *
 * Note: This is a small demo logistic-regression style computation implemented in JS.
 * You can upload a custom model (JSON) with keys matching the defaultModel to override.
 */
function predictLifestyle(userProfile, habits = [], model = {}) {
  // helpers: map profile fields to numeric features
  const age = Number(userProfile.Age || 35);

  // normalize sleep: map strings to buckets
  const sleepStr = userProfile["Sleep Duration"] || "";
  const sleep6to8 = sleepStr === "6–8 hrs" ? 1 : 0;
  const sleepLess6 = sleepStr === "Less than 6 hrs" ? 1 : 0;

  const activity = (userProfile["Physical Activity Level"] || "").toLowerCase();
  const activityLow = activity === "low" ? 1 : 0;
  const activityModerate = activity === "moderate" ? 1 : 0;
  const activityHigh = activity === "high" ? 1 : 0;

  const bmi = (userProfile["BMI Category"] || "").toLowerCase();
  const bmiUnderweight = bmi === "underweight" ? 1 : 0;
  const bmiNormal = bmi === "normal" ? 1 : 0;
  const bmiOverweight = bmi === "overweight" ? 1 : 0;
  const bmiObese = bmi === "obese" ? 1 : 0;

  const hr = Number(userProfile["Heart Rate"] || 70);
  const steps = Number(userProfile["Daily Steps"] || 4000);

  // habit completion rate: average of last 7 day booleans across habits
  let habitRate = 0;
  if (habits.length) {
    const rates = habits.map((h) => {
      const hist = (h.history || []).slice(-7);
      const truthy = hist.reduce((s, v) => s + (v ? 1 : 0), 0);
      return hist.length ? truthy / hist.length : 0;
    });
    habitRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  // default weights with safe fallbacks
  const w = {
    bias: model.bias ?? -0.2,
    age: model.age ?? -0.01,
    sleep6to8: model.sleep6to8 ?? 0.6,
    sleepLess6: model.sleepLess6 ?? -0.4,
    activityLow: model.activityLow ?? -0.5,
    activityModerate: model.activityModerate ?? 0.2,
    activityHigh: model.activityHigh ?? 0.6,
    bmiUnderweight: model.bmiUnderweight ?? -0.2,
    bmiNormal: model.bmiNormal ?? 0.4,
    bmiOverweight: model.bmiOverweight ?? -0.3,
    bmiObese: model.bmiObese ?? -0.7,
    heartRate: model.heartRate ?? -0.01,
    steps: model.steps ?? 0.0002,
    habitRate: model.habitRate ?? 1.2,
  };

  // compute weighted sum
  let s = 0;
  s += w.bias;
  s += w.age * (age / 100); // scale age
  s += w.sleep6to8 * sleep6to8;
  s += w.sleepLess6 * sleepLess6;
  s += w.activityLow * activityLow;
  s += w.activityModerate * activityModerate;
  s += w.activityHigh * activityHigh;
  s += w.bmiUnderweight * bmiUnderweight;
  s += w.bmiNormal * bmiNormal;
  s += w.bmiOverweight * bmiOverweight;
  s += w.bmiObese * bmiObese;
  s += w.heartRate * (hr / 100); // scale hr
  s += w.steps * (steps); // steps weight assumes small multiplier
  s += w.habitRate * habitRate;

  // sigmoid -> probability (0..1)
  const prob = 1 / (1 + Math.exp(-s));

  // map to 0..100
  const score = Math.max(0, Math.min(100, Math.round(prob * 100)));

  // classification thresholds (tunable)
  const classification = score >= 65 ? "Good" : score >= 40 ? "Moderate" : "At-risk";

  // suggestions based on feature contributions
  const suggestions = [];
  if (!sleep6to8) suggestions.push("Aim for 6–8 hours of sleep nightly.");
  if (activityLow) suggestions.push("Increase physical activity gradually (short walks or micro-workouts).");
  if (bmiOverweight || bmiObese) suggestions.push("Consider a consult with a nutritionist and gradual activity increase.");
  if (habitRate < 0.5) suggestions.push("Focus on small daily wins — aim for 70% weekly completion.");
  if (hr > 90) suggestions.push("Monitor resting heart rate; seek medical advice if persistently high.");
  if (steps < 5000) suggestions.push("Increase daily steps by 1k increments per week.");

  // ensure at least two suggestions
  while (suggestions.length < 2) suggestions.push("Keep consistent: small changes compound over time.");

  return { score, classification, suggestions };
}

// --------------------
// Helpers & components (unchanged or slightly adjusted to keep working)
// --------------------

function readLocalState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // basic validation
      if (parsed && parsed.habits && parsed.challenge && parsed.balanceHistory) {
        // ensure userProfile exists
        parsed.userProfile = parsed.userProfile || defaultProfile();
        return parsed;
      }
    }
  } catch (e) {}
  // fallback initial state with 7-day histories inferred from streak
  const baseHabits = [
    { id: 1, title: "Wake at 6:00 AM", streak: 7, confidence: 0.78 },
    { id: 2, title: "30 min workout", streak: 4, confidence: 0.62 },
    { id: 3, title: "No sugar after 6 PM", streak: 10, confidence: 0.85 },
  ].map((h) => {
    const history = inferHistoryFromStreak(h.streak);
    return { ...h, history, completedToday: !!history[history.length - 1], streak: computeStreakFromHistory(history) };
  });

  return {
    challenge: { active: true, day: 8, totalDays: 21, deposit: 500, stakeLocked: true, invested: true },
    habits: baseHabits,
    balanceHistory: [800, 900, 1000, 1100, 1150, 1200, 1240],
    userProfile: defaultProfile(),
  };
}

function inferHistoryFromStreak(streak = 0) {
  // produce a 7-day boolean array where the last `streak` days are true (capped at 7)
  const len = 7;
  const arr = new Array(len).fill(false);
  const s = Math.min(len, streak);
  for (let i = len - s; i < len; i++) arr[i] = true;
  return arr;
}

function computeStreakFromHistory(history = []) {
  // count consecutive true values from the end
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]) count++; else break;
  }
  return count;
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-sm font-medium transition ${active ? "bg-fuchsia-600 text-white shadow" : "bg-white text-slate-700 border hover:shadow-sm"}`}
    >
      {label}
    </button>
  );
}

function Sparkline({ data = [], width = 120, height = 32 }) {
  // convert boolean or numeric data to numeric series
  const series = data.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v || 0)));
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const len = series.length;
  const step = len > 1 ? (width - 6) / (len - 1) : width;

  const points = series.map((d, i) => {
    const x = 3 + i * step;
    const y = 3 + (1 - (d - min) / (max - min || 1)) * (height - 6);
    return [x, y];
  });

  const d = points.length ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") : "";

  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={`sparkGrad-${Math.random()}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#ff7ab6" />
          <stop offset="100%" stopColor="#7c4dff" />
        </linearGradient>
      </defs>

      {points.length > 0 && (
        <motion.path
          d={`${d} L ${points[points.length - 1][0]} ${height - 3} L ${points[0][0]} ${height - 3} Z`}
          fill={`url(#sparkGrad-0)`}
          opacity={0.08}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 0.6 }}
        />
      )}

      <motion.path
        d={d}
        fill="none"
        stroke="#ff6fa3"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </svg>
  );
}

// larger interactive SVG line chart with axes and tooltip
function InteractiveLineChart({ data = [], width = 300, height = 120 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null); // {x,y,index,value}

  const padding = { left: 28, right: 10, top: 8, bottom: 20 };
  const w = width;
  const h = height;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const len = data.length;
  const innerW = w - padding.left - padding.right;
  const innerH = h - padding.top - padding.bottom;
  const step = len > 1 ? innerW / (len - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padding.left + i * step;
    const y = padding.top + (1 - (d - min) / (max - min || 1)) * innerH;
    return { x, y, v: d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  function onMouseMove(e) {
    const bounds = ref.current.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    // find nearest point
    let nearest = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) {
        bestDist = d; nearest = i;
      }
    });
    setHover({ x: points[nearest].x, y: points[nearest].y, index: nearest, value: points[nearest].v });
  }

  return (
    <div className="w-full" style={{ width: "100%" }}>
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="walletGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff7ab6" />
            <stop offset="100%" stopColor="#7c4dff" />
          </linearGradient>
        </defs>

        {/* axes lines */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={h - padding.bottom} stroke="#f1f5f9" />
        <line x1={padding.left} y1={h - padding.bottom} x2={w - padding.right} y2={h - padding.bottom} stroke="#f1f5f9" />

        {/* area */}
        {points.length > 0 && (
          <motion.path d={`${pathD} L ${points[points.length - 1].x} ${h - padding.bottom} L ${points[0].x} ${h - padding.bottom} Z`} fill="url(#walletGrad)" opacity={0.12} initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ duration: 0.6 }} />
        )}

        {/* line */}
        <motion.path d={pathD} fill="none" stroke="url(#walletGrad)" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />

        {/* points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#ff6fa3" strokeWidth={1} />
        ))}

        {/* y axis labels (3 ticks) */}
        {[0, 0.5, 1].map((t, i) => {
          const val = Math.round(min + (max - min) * (1 - t));
          const y = padding.top + t * innerH;
          return (
            <g key={i}>
              <text x={6} y={y + 4} fontSize={10} fill="#7c7c8a">₹{val}</text>
              <line x1={padding.left - 6} y1={y} x2={padding.left} y2={y} stroke="#f1f5f9" />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div className="mt-2 text-xs text-slate-900">
          <div className="inline-block bg-white/90 border rounded px-2 py-1 shadow text-sm">{`Point ${hover.index + 1}: ₹${hover.value}`}</div>
        </div>
      )}
    </div>
  );
}

function ProgressCard({ value = 0 }) {
  return (
    <div className="bg-gradient-to-r from-rose-50 to-violet-50 p-3 rounded-lg border">
      <div className="text-xs text-slate-500">Progress</div>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.8 }} className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-violet-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        </div>
      </motion.div>
      <div className="text-xl font-semibold mt-3">{Math.round(value)}%</div>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.9 }} className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-violet-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ModelCard({ title, value, desc, sparkData = [] }) {
  // show sparkline using numeric conversion of sparkData
  const series = (sparkData || []).map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : Number(v || 0)));
  return (
    <motion.div whileHover={{ y: -6 }} className="p-4 bg-white rounded-lg shadow-sm text-center border hover:shadow-md transition">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{desc}</div>
      <div className="mt-3 flex items-center justify-center">
        {series.length ? <Sparkline data={series} width={140} height={36} /> : null}
      </div>
    </motion.div>
  );
}

/* ---------------------------
   User Profile components
   --------------------------- */

function defaultProfile() {
  return {
    Gender: "",
    Age: "",
    Occupation: "",
    "Sleep Duration": "",
    "Physical Activity Level": "",
    "BMI Category": "",
    "Daily Steps": "",
    "Heart Rate": "",
    BP_Systolic: "",
    BP_Diastolic: "",
    "Sleep Disorder": "",
  };
}

function UserProfileCard({ userProfile = defaultProfile(), onEdit = () => {} }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Your Profile</h4>
          <div className="text-xs text-slate-500 mt-1">Tap Edit to update values — they persist locally.</div>
        </div>
        <div>
          <button onClick={onEdit} className="px-2 py-1 bg-gradient-to-r from-fuchsia-600 to-indigo-500 text-white rounded">Edit</button>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700 space-y-1">
        <div>Gender: <strong>{userProfile.Gender || '—'}</strong></div>
        <div>Age: <strong>{userProfile.Age || '—'}</strong></div>
        <div>Occupation: <strong>{userProfile.Occupation || '—'}</strong></div>
        <div>Sleep: <strong>{userProfile['Sleep Duration'] || '—'}</strong></div>
        <div>Daily Steps: <strong>{userProfile['Daily Steps'] || '—'}</strong></div>
      </div>
    </div>
  );
}

function UserProfileForm({ initial = {}, onSave }) {
  const [form, setForm] = useState(initial || defaultProfile());
  useEffect(() => setForm(initial || defaultProfile()), [initial]);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-3 grid grid-cols-1 gap-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={form.Gender} onChange={(e) => update('Gender', e.target.value)} className="border rounded px-2 py-1">
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input type="number" min="0" placeholder="Age" value={form.Age} onChange={(e) => update('Age', e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <input placeholder="Occupation" value={form.Occupation} onChange={(e) => update('Occupation', e.target.value)} className="border rounded px-2 py-1" />

      <select value={form['Sleep Duration']} onChange={(e) => update('Sleep Duration', e.target.value)} className="border rounded px-2 py-1">
        <option value="">Sleep Duration</option>
        <option value="Less than 6 hrs">Less than 6 hrs</option>
        <option value="6–8 hrs">6–8 hrs</option>
        <option value="More than 8 hrs">More than 8 hrs</option>
      </select>

      <div className="grid grid-cols-2 gap-2">
        <select value={form['Physical Activity Level']} onChange={(e) => update('Physical Activity Level', e.target.value)} className="border rounded px-2 py-1">
          <option value="">Physical Activity Level (%)</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
        </select>
        <select value={form['BMI Category']} onChange={(e) => update('BMI Category', e.target.value)} className="border rounded px-2 py-1">
          <option value="">BMI Category</option>
          <option>Underweight</option>
          <option>Normal</option>
          <option>Overweight</option>
          <option>Obese</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="0" placeholder="Daily Steps" value={form['Daily Steps']} onChange={(e) => update('Daily Steps', e.target.value)} className="border rounded px-2 py-1" />
        <input type="number" min="0" placeholder="Heart Rate (bpm)" value={form['Heart Rate']} onChange={(e) => update('Heart Rate', e.target.value)} className="border rounded px-2 py-1" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="0" placeholder="BP Systolic" value={form['BP_Systolic']} onChange={(e) => update('BP_Systolic', e.target.value)} className="border rounded px-2 py-1" />
        <input type="number" min="0" placeholder="BP Diastolic" value={form['BP_Diastolic']} onChange={(e) => update('BP_Diastolic', e.target.value)} className="border rounded px-2 py-1" />
      </div>

      <input placeholder="Sleep Disorder (if any)" value={form['Sleep Disorder']} onChange={(e) => update('Sleep Disorder', e.target.value)} className="border rounded px-2 py-1" />

      <div className="flex gap-2 mt-2">
        <button type="submit" className="px-3 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white rounded">Save Profile</button>
        <button type="button" onClick={() => setForm(defaultProfile())} className="px-3 py-2 bg-white border rounded">Reset</button>
      </div>
    </form>
  );
}
