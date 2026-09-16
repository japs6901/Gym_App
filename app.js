import { PROGRAM, clampWeek, setCountFor, effortForWeek, targetsFor, targetText, restText } from './program.js';

const APP_VERSION = '0.1.0';
const KEYS = {
  settings: 'gymlog.settings.v1',
  sessions: 'gymlog.sessions.v1',
  active: 'gymlog.active.v1'
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s = '') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const localDate = iso => new Date(`${iso}T12:00:00`);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let settings = loadJSON(KEYS.settings, {
  programStartDate: todayISO(),
  shortcutName: 'Save Gym Workout'
});
let sessions = loadJSON(KEYS.sessions, []);
let active = loadJSON(KEYS.active, null);
let currentView = 'home';
let lastFinishedSession = null;
let timerInterval = null;
let workoutClockInterval = null;
let wakeLock = null;

const app = $('#app');
const modalRoot = $('#modal-root');
const toastRoot = $('#toast-root');

function persistSettings() { saveJSON(KEYS.settings, settings); }
function persistSessions() { saveJSON(KEYS.sessions, sessions); }
function persistActive() { active ? saveJSON(KEYS.active, active) : localStorage.removeItem(KEYS.active); }

function daysBetween(aISO, bISO) {
  const a = localDate(aISO);
  const b = localDate(bISO);
  return Math.floor((b - a) / 86400000);
}
function weekForDate(dateISO) {
  return clampWeek(Math.floor(daysBetween(settings.programStartDate, dateISO) / 7) + 1);
}
function weekdayShort(dateISO) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(localDate(dateISO));
}
function dateDMY(dateISO) {
  const [y,m,d] = dateISO.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
}
function prettyDate(dateISO) {
  return new Intl.DateTimeFormat(undefined, { weekday:'short', day:'numeric', month:'short', year:'numeric' }).format(localDate(dateISO));
}
function timeText(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
}
function durationText(seconds) {
  seconds = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(seconds/3600);
  const m = Math.floor((seconds%3600)/60);
  if (h) return `${h} hr ${m} min`;
  return `${m} min`;
}
function mmss(seconds) {
  seconds = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(seconds/60);
  const s = seconds%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function numberText(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/,'');
}
function formatWeight(v) {
  return (v === null || v === undefined || v === '') ? 'Bodyweight' : `${numberText(v)} kg`;
}
function actualWeekday(session) { return session.weekdayOverride || weekdayShort(session.date); }
function completedSessions() { return sessions.filter(s => s.completed); }
function sortedSessions() { return [...completedSessions()].sort((a,b) => new Date(b.finishedAt || b.startedAt) - new Date(a.finishedAt || a.startedAt)); }
function definitionFor(routine, exerciseId) {
  return PROGRAM.routines[routine]?.exercises.find(e => e.id === exerciseId) ||
    Object.values(PROGRAM.routines).flatMap(r => r.exercises).find(e => e.id === exerciseId);
}
function findLastExercise(exerciseId) {
  for (const s of sortedSessions()) {
    const ex = s.exercises.find(x => x.exerciseId === exerciseId);
    if (ex) return { session: s, exercise: ex };
  }
  return null;
}
function lastSummary(hist) {
  if (!hist) return 'No previous session';
  const ex = hist.exercise;
  const parts = ex.sets.filter(s => s.completed).map(s => {
    if (ex.metric === 'reps') return `${formatWeight(s.weight)} × ${s.amount}`;
    if (ex.metric === 'seconds') return `${s.amount}s`;
    return `${formatWeight(s.weight)} × ${s.amount}m`;
  });
  return parts.length ? parts.join(' · ') : 'No completed sets';
}

function toast(message) {
  toastRoot.innerHTML = `<div class="toast">${esc(message)}</div>`;
  setTimeout(() => { toastRoot.innerHTML = ''; }, 2200);
}

function renderTopbar(title, subtitle = '', right = '') {
  return `<div class="topbar">
    <div class="brand">
      <img class="brand-icon" src="assets/icons/icon-192.png" alt="">
      <div><h1>${esc(title)}</h1>${subtitle ? `<div class="brand-sub">${esc(subtitle)}</div>` : ''}</div>
    </div>
    ${right}
  </div>`;
}

function scheduledRoutineFor(dateISO = todayISO()) {
  const day = weekdayShort(dateISO);
  return Object.entries(PROGRAM.routines).find(([,r]) => r.regularDay === day)?.[0] || null;
}

function renderHome() {
  clearTimersExceptActiveRuntime();
  currentView = 'home';
  const date = todayISO();
  const week = weekForDate(date);
  const scheduled = scheduledRoutineFor(date);
  const resume = active?.session;
  const todayTitle = scheduled ? `Routine ${scheduled}` : 'Choose a workout';
  const todayMeta = scheduled
    ? `${PROGRAM.routines[scheduled].regularDay} schedule · ${PROGRAM.routines[scheduled].exercises.filter(e => e.availableFromWeek <= week).length} exercises`
    : 'No regular Mon/Wed/Fri workout is scheduled today.';

  app.innerHTML = `<main class="screen">
    ${renderTopbar('GymLog', `Private · offline-first · v${APP_VERSION}`, `<button class="icon-btn" id="settingsBtn" aria-label="Settings">⚙︎</button>`)}

    ${resume ? `<div class="notice good" style="margin-bottom:12px"><strong>Workout in progress.</strong> ${esc(`Wk${resume.programWeek} ${resume.routine}-${actualWeekday(resume)} ${dateDMY(resume.date)}`)}</div>` : ''}

    <section class="hero-card">
      <div class="hero-row">
        <div>
          <div class="eyebrow">Today · ${esc(prettyDate(date))}</div>
          <div class="hero-title">${esc(todayTitle)}</div>
          <div class="hero-meta">${esc(todayMeta)}<br>Effort target: ${esc(effortForWeek(week))}</div>
        </div>
        <div class="week-badge"><span>Programme</span><strong>${week}</strong><span>of 26</span></div>
      </div>
      ${scheduled && !resume ? `<button class="primary-btn" data-start="${scheduled}" style="width:100%;margin-top:16px">Start today's workout</button>` : ''}
      ${resume ? `<button class="primary-btn" id="resumeBtn" style="width:100%;margin-top:16px">Resume workout</button>` : ''}
    </section>

    <div class="section-title"><h2>Workouts</h2><small>Routine stays fixed; day follows actual date</small></div>
    <div class="routine-grid">
      ${Object.entries(PROGRAM.routines).map(([id,r]) => {
        const count = r.exercises.filter(e => e.availableFromWeek <= week).length;
        return `<button class="routine-card" data-start="${id}" ${resume ? 'disabled' : ''}>
          <span class="letter">${id}</span>
          <span class="routine-info"><strong>${esc(r.name)}</strong><span>Regular day ${r.regularDay} · ${count} exercises</span></span>
          <span class="chev">›</span>
        </button>`;
      }).join('')}
    </div>

    <div class="home-actions">
      <button class="secondary-btn" id="historyBtn">History</button>
      <button class="secondary-btn" id="installBtn">Install help</button>
    </div>

    <div class="card" style="margin-top:14px">
      <h3>Progression</h3>
      <p>Today's sets and phase targets follow the 26-week programme. Previous weights and reps are prefilled, while the previous suggestion stays visible so you decide whether to change today's load.</p>
    </div>
  </main>`;

  $('#settingsBtn').onclick = renderSettings;
  $('#historyBtn').onclick = renderHistory;
  $('#installBtn').onclick = showInstallHelp;
  if ($('#resumeBtn')) $('#resumeBtn').onclick = renderWorkout;
  $$('[data-start]').forEach(btn => btn.onclick = () => showStartWorkout(btn.dataset.start));
}

function showStartWorkout(routine) {
  const date = todayISO();
  showModal(`<div class="modal-handle"></div>
    <div class="modal-head"><div><div class="eyebrow">New workout</div><h2>Routine ${routine}</h2></div><button class="close-btn" data-close>×</button></div>
    <div class="settings-grid" style="margin-top:14px">
      <div class="settings-row">
        <label class="title" for="startDate">Workout date</label>
        <div class="help">The weekday in the note is generated from this date. You can override it inside the workout if needed.</div>
        <input type="date" id="startDate" value="${date}">
      </div>
      <div class="settings-row">
        <label class="title" for="startWeek">Programme week</label>
        <div class="help">Calculated from your programme start date, but you can override it here.</div>
        <input type="number" id="startWeek" min="1" max="26" value="${weekForDate(date)}">
      </div>
      <button class="primary-btn" id="confirmStart">Start Routine ${routine}</button>
    </div>`);
  const dateInput = $('#startDate', modalRoot);
  const weekInput = $('#startWeek', modalRoot);
  dateInput.onchange = () => { weekInput.value = weekForDate(dateInput.value); };
  $('#confirmStart', modalRoot).onclick = () => {
    const d = dateInput.value || todayISO();
    const w = clampWeek(weekInput.value);
    closeModal();
    createWorkout(routine, d, w);
  };
}

function createWorkout(routine, date, week) {
  const defs = PROGRAM.routines[routine].exercises.filter(e => e.availableFromWeek <= week);
  const exercises = defs.map(def => {
    const hist = findLastExercise(def.id);
    const count = setCountFor(def, week);
    const targets = targetsFor(def, week);
    let derivedStartWeight = def.startWeight;
    if (def.id === 'light_goblet_squat' && derivedStartWeight == null) {
      const squatHist = findLastExercise('goblet_squat');
      const firstWeight = squatHist?.exercise?.sets?.find(s => s.completed && s.weight != null)?.weight;
      if (firstWeight != null) derivedStartWeight = Math.round(firstWeight * 0.65 * 2) / 2;
    }
    const sets = Array.from({length: count}, (_, i) => {
      const prev = hist?.exercise?.sets?.[i] || hist?.exercise?.sets?.at(-1);
      return {
        id: uid(),
        weight: prev?.weight ?? derivedStartWeight ?? null,
        amount: prev?.amount ?? targets.min,
        rir: prev?.rir ?? null,
        restSeconds: null,
        setDurationSeconds: null,
        completed: false
      };
    });
    return {
      id: uid(), exerciseId: def.id, name: def.name, metric: def.metric, category: def.category,
      targetMin: targets.min, targetMax: targets.max, sets,
      notes: '', previousSuggestion: hist?.exercise?.nextSuggestion || '', nextSuggestion: '',
      previousSummary: lastSummary(hist)
    };
  });
  active = {
    session: {
      id: uid(), programWeek: week, routine, date, weekdayOverride: null,
      startedAt: new Date().toISOString(), finishedAt: null,
      warmup: { shoulders:false, hips:false },
      cooldown: { chest:false, hipFlexor:false, balance:false },
      exercises, notes:'', completed:false
    },
    timer: null
  };
  persistActive();
  requestWakeLock();
  renderWorkout();
}

function renderWorkout() {
  currentView = 'workout';
  if (!active?.session) { renderHome(); return; }
  const s = active.session;
  const routine = PROGRAM.routines[s.routine];
  const progress = workoutProgress(s);
  app.innerHTML = `<main class="screen with-fixed-bar">
    <header class="workout-header">
      <div class="row">
        <button class="ghost-btn" id="homeDuringWorkout">‹ Home</button>
        <div style="text-align:center"><h1>Wk${s.programWeek} ${s.routine}-${esc(actualWeekday(s))}</h1><div class="meta">${esc(prettyDate(s.date))} · <span id="workoutElapsed">${durationText((Date.now()-new Date(s.startedAt))/1000)}</span></div></div>
        <button class="icon-btn" id="workoutDetails" aria-label="Workout details">⋯</button>
      </div>
      <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:${progress}%"></div></div>
    </header>

    <div class="notice" style="margin-bottom:12px"><strong>Effort target:</strong> ${esc(effortForWeek(s.programWeek))}. The previous session's entries are prefilled; change them to what you actually do today.</div>

    <section class="card">
      <h3>Warm-up</h3>
      <div class="check-list">
        ${PROGRAM.warmup.map(item => `<div class="check-row"><input type="checkbox" id="warm-${item.id}" data-warm="${item.id}" ${s.warmup[item.id]?'checked':''}><label for="warm-${item.id}">${esc(item.label)}</label></div>`).join('')}
      </div>
    </section>

    <div class="section-title"><h2>${esc(routine.name)}</h2><small>${s.exercises.length} exercises</small></div>
    <div id="exerciseList">
      ${s.exercises.map((ex, idx) => exerciseCardHTML(ex, idx, s)).join('')}
    </div>

    <section class="card">
      <h3>Cool-down</h3>
      <div class="check-list">
        ${PROGRAM.cooldown.map(item => `<div class="check-row"><input type="checkbox" id="cool-${item.id}" data-cool="${item.id}" ${s.cooldown[item.id]?'checked':''}><label for="cool-${item.id}">${esc(item.label)}</label></div>`).join('')}
      </div>
    </section>

    <section class="card">
      <h3>Notes / discomfort / modifications</h3>
      <textarea id="sessionNotes" style="width:100%;min-height:110px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);padding:10px" placeholder="Anything you want included in the Notes log…">${esc(s.notes)}</textarea>
    </section>

    <div class="bottom-actions">
      <button class="secondary-btn" id="saveWorkout">Save</button>
      <button class="secondary-btn" id="cancelWorkout">Cancel</button>
      <button class="primary-btn" id="finishWorkout">Complete workout</button>
    </div>
    <div id="runtimeBar"></div>
  </main>`;

  attachWorkoutEvents();
  renderRuntimeBar();
  startWorkoutClock();
}

function exerciseCardHTML(ex, idx, session) {
  const def = definitionFor(session.routine, ex.exerciseId);
  const timed = ex.metric === 'seconds';
  return `<article class="exercise-card" data-exercise-index="${idx}">
    <div class="exercise-head">
      <div class="exercise-number">${idx+1}</div>
      <div class="exercise-title">
        <h3>${esc(ex.name)}</h3>
        <div class="meta">Target ${esc(targetText(def, session.programWeek))} · Rest ${esc(restText(def))}</div>
      </div>
      <button class="info-round" data-info="${idx}" aria-label="Exercise instructions">i</button>
    </div>
    <div class="previous-block">
      <strong>Last session</strong>${esc(ex.previousSummary || 'No previous session')}
      <div class="suggestion">${ex.previousSuggestion ? `Previous suggestion: ${esc(ex.previousSuggestion)}` : 'No previous modification suggested.'}</div>
    </div>
    <div class="sets">
      ${ex.sets.map((set, setIdx) => setRowHTML(ex, set, idx, setIdx, timed)).join('')}
    </div>
    <div class="exercise-footer">
      <details ${ex.notes ? 'open' : ''}>
        <summary>Exercise note</summary>
        <textarea data-ex-note="${idx}" placeholder="Optional note for this exercise…">${esc(ex.notes)}</textarea>
      </details>
    </div>
  </article>`;
}

function setRowHTML(ex, set, exIdx, setIdx, timed) {
  const rest = set.restSeconds != null ? `<div style="margin:-4px 0 8px 48px;color:var(--muted);font-size:12px">Recorded rest: ${set.restSeconds} sec</div>` : '';
  if (timed) {
    const isSetTimer = active?.timer?.type === 'set' && active.timer.exerciseIndex === exIdx && active.timer.setIndex === setIdx;
    return `<div class="set-block">
      <div class="set-row timed">
        <div class="set-label">${setIdx+1}</div>
        <div class="field"><label>Duration</label><input type="number" inputmode="numeric" min="0" data-amount="${exIdx}:${setIdx}" value="${Number(set.amount)||0}"></div>
        <div class="field"><label>RIR</label><select data-rir="${exIdx}:${setIdx}">${rirOptions(set.rir)}</select></div>
        <button class="timer-set-btn ${isSetTimer?'active':''}" data-set-timer="${exIdx}:${setIdx}">${isSetTimer ? 'Finish' : (set.completed ? 'Redo' : 'Start')}</button>
      </div>${rest}
    </div>`;
  }
  return `<div class="set-block">
    <div class="set-row">
      <div class="set-label">${setIdx+1}</div>
      <div class="field"><label>kg</label><input type="number" inputmode="decimal" step="0.5" min="0" data-weight="${exIdx}:${setIdx}" value="${set.weight ?? ''}" placeholder="BW"></div>
      <div class="field"><label>${ex.metric === 'meters' ? 'm/side' : 'reps'}</label><input type="number" inputmode="numeric" min="0" data-amount="${exIdx}:${setIdx}" value="${Number(set.amount)||0}"></div>
      <div class="field"><label>RIR</label><select data-rir="${exIdx}:${setIdx}">${rirOptions(set.rir)}</select></div>
      <button class="done-btn ${set.completed?'completed':''}" data-done="${exIdx}:${setIdx}" aria-label="Mark set complete">${set.completed?'✓':'○'}</button>
    </div>${rest}
  </div>`;
}

function rirOptions(value) {
  return `<option value="" ${value==null?'selected':''}>—</option>` + [0,1,2,3,4,5].map(n => `<option value="${n}" ${Number(value)===n?'selected':''}>${n}</option>`).join('');
}

function attachWorkoutEvents() {
  const s = active.session;
  $$('[data-warm]').forEach(el => el.onchange = () => { s.warmup[el.dataset.warm] = el.checked; persistActive(); updateProgress(); });
  $$('[data-cool]').forEach(el => el.onchange = () => { s.cooldown[el.dataset.cool] = el.checked; persistActive(); updateProgress(); });
  $$('[data-weight]').forEach(el => el.onchange = () => {
    const [e,i] = el.dataset.weight.split(':').map(Number);
    s.exercises[e].sets[i].weight = el.value === '' ? null : Number(el.value);
    persistActive();
  });
  $$('[data-amount]').forEach(el => el.onchange = () => {
    const [e,i] = el.dataset.amount.split(':').map(Number);
    s.exercises[e].sets[i].amount = Number(el.value) || 0;
    persistActive();
  });
  $$('[data-rir]').forEach(el => el.onchange = () => {
    const [e,i] = el.dataset.rir.split(':').map(Number);
    s.exercises[e].sets[i].rir = el.value === '' ? null : Number(el.value);
    persistActive();
  });
  $$('[data-done]').forEach(btn => btn.onclick = () => {
    const [e,i] = btn.dataset.done.split(':').map(Number);
    toggleSetComplete(e,i,btn);
  });
  $$('[data-set-timer]').forEach(btn => btn.onclick = () => {
    const [e,i] = btn.dataset.setTimer.split(':').map(Number);
    handleTimedSet(e,i);
  });
  $$('[data-info]').forEach(btn => btn.onclick = () => showExerciseInfo(Number(btn.dataset.info)));
  $$('[data-ex-note]').forEach(el => el.oninput = () => { s.exercises[Number(el.dataset.exNote)].notes = el.value; persistActive(); });
  $('#sessionNotes').oninput = e => { s.notes = e.target.value; persistActive(); };
  $('#homeDuringWorkout').onclick = () => { persistActive(); renderHome(); };
  $('#workoutDetails').onclick = showWorkoutDetails;
  $('#saveWorkout').onclick = () => { persistActive(); toast('Workout saved'); };
  $('#cancelWorkout').onclick = cancelWorkout;
  $('#finishWorkout').onclick = completeWorkout;
}

function toggleSetComplete(exIdx, setIdx, btn) {
  if (active?.timer?.type === 'set') { toast('Finish the timed set first'); return; }
  const set = active.session.exercises[exIdx].sets[setIdx];
  set.completed = !set.completed;
  if (set.completed) {
    btn.classList.add('completed'); btn.textContent = '✓';
    startRestTimer(exIdx, setIdx);
  } else {
    btn.classList.remove('completed'); btn.textContent = '○';
    if (active?.timer?.type === 'rest' && active.timer.exerciseIndex === exIdx && active.timer.setIndex === setIdx) {
      active.timer = null;
      renderRuntimeBar();
    }
    set.restSeconds = null;
  }
  persistActive(); updateProgress();
}

function handleTimedSet(exIdx, setIdx) {
  const t = active.timer;
  if (t?.type === 'set' && t.exerciseIndex === exIdx && t.setIndex === setIdx) {
    finishTimedSet(exIdx, setIdx);
    return;
  }
  if (t?.type === 'rest') stopRestTimer(true);
  if (t?.type === 'set') { toast('Finish the current timed set first'); return; }
  active.timer = { type:'set', exerciseIndex:exIdx, setIndex:setIdx, startedAt:Date.now() };
  persistActive();
  renderRuntimeBar();
  const btn = $(`[data-set-timer="${exIdx}:${setIdx}"]`);
  if (btn) { btn.textContent = 'Finish'; btn.classList.add('active'); }
}

function finishTimedSet(exIdx, setIdx) {
  const t = active.timer;
  if (!t || t.type !== 'set') return;
  const elapsed = Math.max(1, Math.round((Date.now() - t.startedAt)/1000));
  const ex = active.session.exercises[exIdx];
  const set = ex.sets[setIdx];
  set.amount = elapsed;
  set.setDurationSeconds = elapsed;
  set.completed = true;
  active.timer = null;
  persistActive();
  const amountInput = $(`[data-amount="${exIdx}:${setIdx}"]`);
  if (amountInput) amountInput.value = elapsed;
  const btn = $(`[data-set-timer="${exIdx}:${setIdx}"]`);
  if (btn) { btn.textContent = 'Redo'; btn.classList.remove('active'); }
  updateProgress();
  startRestTimer(exIdx, setIdx);
}

function startRestTimer(exIdx, setIdx) {
  if (active?.timer?.type === 'rest') stopRestTimer(true);
  if (active?.timer?.type === 'set') return;
  active.timer = { type:'rest', exerciseIndex:exIdx, setIndex:setIdx, startedAt:Date.now() };
  persistActive(); renderRuntimeBar();
}

function stopRestTimer(record = true) {
  if (!active?.timer || active.timer.type !== 'rest') return;
  const t = active.timer;
  const elapsed = Math.max(0, Math.round((Date.now() - t.startedAt)/1000));
  if (record) {
    const set = active.session.exercises[t.exerciseIndex]?.sets?.[t.setIndex];
    if (set) set.restSeconds = elapsed;
  }
  active.timer = null;
  persistActive();
  renderRuntimeBar();
  if (currentView === 'workout') {
    const card = $(`[data-exercise-index="${t.exerciseIndex}"]`);
    const row = card?.querySelectorAll('.set-block')?.[t.setIndex];
    if (row && record) {
      let caption = row.querySelector('.rest-caption');
      if (!caption) {
        caption = document.createElement('div');
        caption.className = 'rest-caption';
        caption.style.cssText = 'margin:-4px 0 8px 48px;color:var(--muted);font-size:12px';
        row.appendChild(caption);
      }
      caption.textContent = `Recorded rest: ${elapsed} sec`;
    }
  }
}

function renderRuntimeBar() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const container = $('#runtimeBar');
  if (!container || !active?.timer) { if (container) container.innerHTML = ''; return; }
  const t = active.timer;
  const ex = active.session.exercises[t.exerciseIndex];
  const def = definitionFor(active.session.routine, ex.exerciseId);
  const elapsed = () => Math.max(0, Math.round((Date.now()-t.startedAt)/1000));
  if (t.type === 'rest') {
    container.innerHTML = `<div class="rest-bar"><div class="rest-time" id="runtimeTime">${mmss(elapsed())}</div><div class="rest-copy"><strong>Rest · ${esc(ex.name)}</strong><span>Target ${esc(restText(def))}</span></div><button id="runtimeAction">Continue</button></div>`;
    $('#runtimeAction').onclick = () => stopRestTimer(true);
  } else {
    container.innerHTML = `<div class="rest-bar"><div class="rest-time" id="runtimeTime">${mmss(elapsed())}</div><div class="rest-copy"><strong>Set duration · ${esc(ex.name)}</strong><span>Tap Finish when the set ends</span></div><button id="runtimeAction">Finish set</button></div>`;
    $('#runtimeAction').onclick = () => finishTimedSet(t.exerciseIndex, t.setIndex);
  }
  timerInterval = setInterval(() => {
    const el = $('#runtimeTime');
    if (el) el.textContent = mmss(elapsed());
  }, 500);
}

function startWorkoutClock() {
  if (workoutClockInterval) clearInterval(workoutClockInterval);
  workoutClockInterval = setInterval(() => {
    const el = $('#workoutElapsed');
    if (el && active?.session) el.textContent = durationText((Date.now() - new Date(active.session.startedAt))/1000);
  }, 30000);
}
function clearTimersExceptActiveRuntime() {
  if (workoutClockInterval) { clearInterval(workoutClockInterval); workoutClockInterval = null; }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function workoutProgress(s) {
  const checkTotal = PROGRAM.warmup.length + PROGRAM.cooldown.length;
  const checkDone = Object.values(s.warmup).filter(Boolean).length + Object.values(s.cooldown).filter(Boolean).length;
  const sets = s.exercises.flatMap(e => e.sets);
  const setDone = sets.filter(x => x.completed).length;
  return Math.round(((checkDone + setDone) / Math.max(1, checkTotal + sets.length)) * 100);
}
function updateProgress() {
  const el = $('#progressFill');
  if (el) el.style.width = `${workoutProgress(active.session)}%`;
}

function showExerciseInfo(index) {
  const s = active.session;
  const ex = s.exercises[index];
  const def = definitionFor(s.routine, ex.exerciseId);
  showModal(`<div class="modal-handle"></div>
    <div class="modal-head"><div><div class="eyebrow">Exercise ${index+1}</div><h2>${esc(def.name)}</h2><span class="muscle-pill">${esc(def.muscles)}</span></div><button class="close-btn" data-close>×</button></div>
    <img class="exercise-image" src="${esc(def.image)}" alt="Illustration for ${esc(def.name)}">
    <div class="kv"><div class="k">Target</div><div>${esc(targetText(def, s.programWeek))}</div><div class="k">Rest</div><div>${esc(restText(def))}</div>${def.weightNote ? `<div class="k">Load</div><div>${esc(def.weightNote)}</div>` : ''}</div>
    <h3>How to do it</h3><ol>${def.instructions.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <h3>Technique cues</h3><ul>${def.cues.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
}

function showWorkoutDetails() {
  const s = active.session;
  showModal(`<div class="modal-handle"></div>
    <div class="modal-head"><div><div class="eyebrow">Workout details</div><h2>Routine ${s.routine}</h2></div><button class="close-btn" data-close>×</button></div>
    <div class="settings-grid" style="margin-top:14px">
      <div class="settings-row"><label class="title">Workout date</label><input type="date" id="editWorkoutDate" value="${s.date}"></div>
      <div class="settings-row"><label class="title">Weekday label</label><div class="help">Auto uses the actual date. Override only if you want a different label in the generated note.</div>
        <select id="editWeekday"><option value="">Auto (${weekdayShort(s.date)})</option>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<option value="${d}" ${s.weekdayOverride===d?'selected':''}>${d}</option>`).join('')}</select></div>
      <div class="settings-row"><label class="title">Programme week</label><div class="help">Fixed when the workout starts so the correct sets and targets remain attached to this session.</div><input value="${s.programWeek}" disabled></div>
      <button class="primary-btn" id="saveWorkoutDetails">Save details</button>
    </div>`);
  $('#editWorkoutDate', modalRoot).onchange = e => {
    const sel = $('#editWeekday', modalRoot);
    if (!sel.value) sel.options[0].textContent = `Auto (${weekdayShort(e.target.value)})`;
  };
  $('#saveWorkoutDetails', modalRoot).onclick = () => {
    s.date = $('#editWorkoutDate', modalRoot).value || s.date;
    s.weekdayOverride = $('#editWeekday', modalRoot).value || null;
    persistActive(); closeModal(); renderWorkout();
  };
}

function cancelWorkout() {
  showModal(`<div class="modal-handle"></div><div class="modal-head"><h2>Cancel this workout?</h2><button class="close-btn" data-close>×</button></div>
    <p style="color:var(--muted);line-height:1.5">This deletes the active workout. Completed workout history is not affected.</p>
    <div class="setting-actions"><button class="secondary-btn" data-close>Keep workout</button><button class="danger-btn" id="confirmCancel">Delete active workout</button></div>`);
  $('#confirmCancel', modalRoot).onclick = () => {
    active = null; persistActive(); releaseWakeLock(); closeModal(); renderHome();
  };
}

function suggestionFor(ex, session) {
  const def = definitionFor(session.routine, ex.exerciseId);
  const completed = ex.sets.filter(s => s.completed);
  const allDone = completed.length === ex.sets.length;
  if (!allDone) return 'Repeat the current load/setup next time and complete the prescribed sets before progressing.';
  if (session.programWeek === 25) return 'Deload completed. Keep Week 25 genuinely easy; return to the normal progression approach in Week 26.';
  if (def.id === 'light_goblet_squat') return 'Keep this deliberately light at about 60–70% of the main goblet squat load; technique remains the priority.';

  const allAtTop = completed.every(s => Number(s.amount) >= Number(ex.targetMax));
  const allAtBottom = completed.every(s => Number(s.amount) >= Number(ex.targetMin));
  const rirs = completed.map(s => s.rir).filter(v => v !== null && v !== undefined);
  const allRIRRecorded = rirs.length === completed.length;
  const aboutTwoOrMore = allRIRRecorded && rirs.every(v => Number(v) >= 2);
  const veryHard = rirs.some(v => Number(v) <= 0);

  if (ex.metric === 'reps') {
    if (allAtTop && aboutTwoOrMore) return 'Increase the weight by the smallest practical increment next time, then work from the lower end of the target rep range.';
    if (allAtTop && !allRIRRecorded) return 'Top of the rep range was reached. If form was good and about 2 RIR remained, increase by the smallest practical increment next time.';
    if (!allAtBottom || veryHard) return 'Keep the current load next time. If form was difficult or reps fall below target again, consider a smaller load.';
    return 'Keep the current load and work toward the top of the target rep range on every set.';
  }
  if (allAtTop) return 'You reached the top of the target range on all sets. Progress conservatively next time only if form remained solid.';
  return 'Keep the current setup and work toward the top of the target range on all sets.';
}

function completeWorkout() {
  if (active?.timer?.type === 'set') { toast('Finish the timed set first'); return; }
  if (active?.timer?.type === 'rest') stopRestTimer(true);
  const s = active.session;
  const incomplete = s.exercises.flatMap(e => e.sets).filter(x => !x.completed).length;
  const proceed = () => {
    s.finishedAt = new Date().toISOString();
    s.completed = true;
    s.exercises.forEach(ex => ex.nextSuggestion = suggestionFor(ex, s));
    sessions.push(JSON.parse(JSON.stringify(s)));
    persistSessions();
    lastFinishedSession = JSON.parse(JSON.stringify(s));
    active = null; persistActive(); releaseWakeLock();
    closeModal(); renderFinish(lastFinishedSession);
  };
  if (incomplete) {
    showModal(`<div class="modal-handle"></div><div class="modal-head"><h2>Finish with ${incomplete} incomplete set${incomplete===1?'':'s'}?</h2><button class="close-btn" data-close>×</button></div>
      <p style="color:var(--muted);line-height:1.5">Incomplete sets will be marked as not completed in the stored workout.</p>
      <div class="setting-actions"><button class="secondary-btn" data-close>Go back</button><button class="primary-btn" id="finishAnyway">Finish workout</button></div>`);
    $('#finishAnyway', modalRoot).onclick = proceed;
  } else proceed();
}

function renderFinish(session) {
  clearTimersExceptActiveRuntime();
  currentView = 'finish';
  const log = generateNotesLog(session);
  app.innerHTML = `<main class="screen">
    ${renderTopbar('Workout complete', `Wk${session.programWeek} ${session.routine}-${actualWeekday(session)}`, `<button class="icon-btn" id="finishHome">⌂</button>`)}
    <section class="summary-card card">
      <div class="hero-row"><div><div class="eyebrow">Saved locally</div><div class="hero-title" style="font-size:24px">${esc(dateDMY(session.date))}</div><div class="hero-meta">${esc(timeText(session.startedAt))} → ${esc(timeText(session.finishedAt))} · ${esc(durationText((new Date(session.finishedAt)-new Date(session.startedAt))/1000))}</div></div><div class="week-badge"><span>Routine</span><strong>${session.routine}</strong><span>${esc(actualWeekday(session))}</span></div></div>
    </section>
    <div class="section-title"><h2>Apple Notes log</h2><small>First line becomes the note title</small></div>
    <pre class="log-preview" id="logPreview">${esc(log)}</pre>
    <div class="finish-actions">
      <button class="primary-btn" id="sendNotes">Copy + Run Notes Shortcut</button>
      <button class="secondary-btn" id="copyLog">Copy log only</button>
      <button class="secondary-btn" id="finishHistory">View history</button>
    </div>
    <div class="notice" style="margin-top:12px">The Shortcut controls which Apple Notes folder receives the log. Set its name in GymLog Settings and choose the Notes folder inside the Shortcut.</div>
  </main>`;
  $('#finishHome').onclick = renderHome;
  $('#finishHistory').onclick = renderHistory;
  $('#copyLog').onclick = async () => { await copyText(log); toast('Log copied'); };
  $('#sendNotes').onclick = () => runNotesShortcut(session);
}

function generateNotesLog(session) {
  const title = `Wk${session.programWeek} ${session.routine}-${actualWeekday(session)} ${dateDMY(session.date)}`;
  const durationSeconds = Math.max(0, Math.round((new Date(session.finishedAt || Date.now()) - new Date(session.startedAt))/1000));
  const check = b => b ? '✓' : ' ';
  const lines = [
    title, '', 'Gym Log Sheet', '',
    '=====================',
    `GYM LOG SHEET - WEEK #: ${session.programWeek}  DAY: [ ${actualWeekday(session)} ]`,
    '=====================', '',
    `Start: ${timeText(session.startedAt)}`,
    `Finish: ${timeText(session.finishedAt)}`,
    `Duration: ${durationText(durationSeconds)}`, '',
    'WARM-UP COMPLETE:', '',
    `[${check(session.warmup.shoulders)}] ${PROGRAM.warmup.find(x=>x.id==='shoulders').label}`,
    `[${check(session.warmup.hips)}] ${PROGRAM.warmup.find(x=>x.id==='hips').label}`, ''
  ];
  session.exercises.forEach((ex, idx) => {
    lines.push(`EXERCISE ${idx+1}: ${ex.name}`, '');
    ex.sets.forEach((set, i) => {
      const done = set.completed ? '' : ' [not completed]';
      const rir = set.rir == null ? '—' : set.rir;
      const rest = set.restSeconds == null ? '—' : set.restSeconds;
      if (ex.metric === 'reps') lines.push(`Set ${i+1}: ${formatWeight(set.weight)} x ${set.amount} reps - RIR ${rir} - Rest - ${rest} secs${done}`);
      if (ex.metric === 'seconds') lines.push(`Set ${i+1}: ${set.amount} secs - RIR ${rir} - Rest - ${rest} secs${done}`);
      if (ex.metric === 'meters') lines.push(`Set ${i+1}: ${formatWeight(set.weight)} x ${set.amount} m/side - RIR ${rir} - Rest - ${rest} secs${done}`);
    });
    if (ex.notes?.trim()) lines.push('', `Exercise note: ${ex.notes.trim()}`);
    lines.push('');
  });
  lines.push('COOL-DOWN', '',
    `[${check(session.cooldown.chest)}] ${PROGRAM.cooldown.find(x=>x.id==='chest').label}`,
    `[${check(session.cooldown.hipFlexor)}] ${PROGRAM.cooldown.find(x=>x.id==='hipFlexor').label}`,
    `[${check(session.cooldown.balance)}] ${PROGRAM.cooldown.find(x=>x.id==='balance').label}`, '',
    'NOTES / DISCOMFORT MODIFICATIONS:',
    session.notes?.trim() || '—', '',
    'SUGGESTED MODIFICATIONS FOR NEXT WORKOUT:'
  );
  session.exercises.forEach(ex => lines.push(`${ex.name}: ${ex.nextSuggestion || '—'}`));
  return lines.join('\n');
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}
async function runNotesShortcut(session) {
  const log = generateNotesLog(session);
  await copyText(log);
  const name = settings.shortcutName?.trim() || 'Save Gym Workout';
  toast('Log copied · opening Shortcut');
  setTimeout(() => {
    window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=clipboard`;
  }, 250);
}

function renderHistory() {
  clearTimersExceptActiveRuntime();
  currentView = 'history';
  const list = sortedSessions();
  app.innerHTML = `<main class="screen">
    ${renderTopbar('History', `${list.length} completed workout${list.length===1?'':'s'}`, `<button class="icon-btn" id="historyHome">⌂</button>`)}
    <div class="history-list">
      ${list.length ? list.map(s => `<article class="history-card"><div class="history-letter">${s.routine}</div><div class="history-main"><strong>Wk${s.programWeek} ${s.routine}-${esc(actualWeekday(s))}</strong><span>${esc(dateDMY(s.date))} · ${esc(durationText((new Date(s.finishedAt)-new Date(s.startedAt))/1000))}</span></div><button data-history="${s.id}">View</button></article>`).join('') : `<div class="empty">No completed workouts yet.</div>`}
    </div>
  </main>`;
  $('#historyHome').onclick = renderHome;
  $$('[data-history]').forEach(btn => btn.onclick = () => showHistoryItem(btn.dataset.history));
}
function showHistoryItem(id) {
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  const log = generateNotesLog(s);
  showModal(`<div class="modal-handle"></div><div class="modal-head"><div><div class="eyebrow">Workout history</div><h2>Wk${s.programWeek} ${s.routine}-${esc(actualWeekday(s))}</h2></div><button class="close-btn" data-close>×</button></div>
    <pre class="log-preview" style="margin-top:12px">${esc(log)}</pre>
    <div class="setting-actions"><button class="secondary-btn" id="historyCopy">Copy log</button><button class="primary-btn" id="historyNotes">Send to Notes</button></div>`);
  $('#historyCopy', modalRoot).onclick = async () => { await copyText(log); toast('Log copied'); };
  $('#historyNotes', modalRoot).onclick = () => runNotesShortcut(s);
}

function renderSettings() {
  clearTimersExceptActiveRuntime();
  currentView = 'settings';
  app.innerHTML = `<main class="screen">
    ${renderTopbar('Settings', 'GymLog stays on this device', `<button class="icon-btn" id="settingsHome">⌂</button>`)}
    <div class="settings-grid">
      <div class="settings-row">
        <label class="title" for="programStart">Programme start date</label>
        <div class="help">GymLog calculates Week 1–26 from this date. You can still override the week before starting any workout.</div>
        <input type="date" id="programStart" value="${esc(settings.programStartDate)}">
      </div>
      <div class="settings-row">
        <label class="title" for="shortcutName">Apple Shortcut name</label>
        <div class="help">Default: Save Gym Workout. The shortcut receives the completed log from the clipboard and creates a Note in the folder you choose.</div>
        <input type="text" id="shortcutName" value="${esc(settings.shortcutName || '')}">
        <div class="setting-actions"><button class="secondary-btn" id="shortcutHelp">Shortcut setup</button></div>
      </div>
      <div class="settings-row">
        <label class="title">Backup your history</label>
        <div class="help">The app is offline-first. Export a backup occasionally so your workout history can be restored if Safari site data is cleared.</div>
        <div class="setting-actions"><button class="secondary-btn" id="exportBackup">Export backup</button><label class="secondary-btn" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">Restore backup<input type="file" id="restoreBackup" accept="application/json" hidden></label></div>
      </div>
      <div class="settings-row">
        <label class="title">Privacy</label>
        <div class="help">Workout data is stored locally in your browser. GymLog has no account, analytics, advertising, or cloud database.</div>
      </div>
      <button class="primary-btn" id="saveSettings">Save settings</button>
    </div>
  </main>`;
  $('#settingsHome').onclick = renderHome;
  $('#saveSettings').onclick = () => {
    settings.programStartDate = $('#programStart').value || todayISO();
    settings.shortcutName = $('#shortcutName').value.trim() || 'Save Gym Workout';
    persistSettings(); toast('Settings saved'); renderHome();
  };
  $('#shortcutHelp').onclick = showShortcutHelp;
  $('#exportBackup').onclick = exportBackup;
  $('#restoreBackup').onchange = restoreBackup;
}

function exportBackup() {
  const payload = JSON.stringify({ app:'GymLog', version:APP_VERSION, exportedAt:new Date().toISOString(), settings, sessions }, null, 2);
  const blob = new Blob([payload], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `GymLog-backup-${todayISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function restoreBackup(e) {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.sessions)) throw new Error('Invalid backup');
      sessions = data.sessions;
      if (data.settings) settings = {...settings, ...data.settings};
      persistSessions(); persistSettings(); toast('Backup restored'); setTimeout(renderSettings, 500);
    } catch { toast('Could not restore this backup'); }
  };
  reader.readAsText(file);
}

function showInstallHelp() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  showModal(`<div class="modal-handle"></div><div class="modal-head"><div><div class="eyebrow">iPhone installation</div><h2>${standalone ? 'GymLog is installed' : 'Add GymLog to Home Screen'}</h2></div><button class="close-btn" data-close>×</button></div>
    ${standalone ? `<p style="color:var(--muted);line-height:1.5">You are already running GymLog as a standalone Home Screen web app.</p>` : `<ol class="install-steps"><li>Open the hosted GymLog address in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Turn on <strong>Open as Web App</strong> if that option is shown, then tap <strong>Add</strong>.</li></ol>`}
    <div class="notice" style="margin-top:14px">After the first load, the core app and exercise images are cached for offline use.</div>`);
}
function showShortcutHelp() {
  showModal(`<div class="modal-handle"></div><div class="modal-head"><div><div class="eyebrow">Apple Notes export</div><h2>Create the “${esc(settings.shortcutName || 'Save Gym Workout')}” Shortcut</h2></div><button class="close-btn" data-close>×</button></div>
    <ol class="install-steps">
      <li>Open Apple's <strong>Shortcuts</strong> app on the iPhone and create a new shortcut.</li>
      <li>Name it exactly <strong>${esc(settings.shortcutName || 'Save Gym Workout')}</strong>.</li>
      <li>Add a <strong>Create Note</strong> action.</li>
      <li>Use <strong>Shortcut Input</strong> as the note text. GymLog launches the shortcut with the clipboard as its input.</li>
      <li>In the Create Note action, choose the Apple Notes folder where you want GymLog entries saved.</li>
      <li>Save the shortcut. From GymLog, use <strong>Copy + Run Notes Shortcut</strong> after a workout.</li>
    </ol>
    <div class="notice warn" style="margin-top:14px">If your version of Shortcuts does not expose Shortcut Input as expected, add a <strong>Get Clipboard</strong> action before Create Note and use its result as the note text.</div>`);
}

function showModal(html) {
  modalRoot.innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><section class="modal">${html}</section></div>`;
  $$('[data-close]', modalRoot).forEach(el => el.onclick = closeModal);
  $('#modalBackdrop').onclick = e => { if (e.target.id === 'modalBackdrop') closeModal(); };
}
function closeModal() { modalRoot.innerHTML = ''; }

async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }
  catch { wakeLock = null; }
}
function releaseWakeLock() { try { wakeLock?.release(); } catch {} wakeLock = null; }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && active?.session && currentView === 'workout') requestWakeLock();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

window.addEventListener('beforeunload', () => { if (active) persistActive(); });
registerServiceWorker();
renderHome();
