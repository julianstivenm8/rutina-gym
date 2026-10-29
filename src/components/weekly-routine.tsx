"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { ACTIVITIES, getWeekModel, type Activity, type WeekModel } from "@/lib/routine";
import { ActivityIcon, ArrowIcon, CalendarIcon, ClockIcon, CycleIcon, DumbbellIcon, InfoIcon } from "./icons";

type ViewState = { week: WeekModel; selectedIndex: number } | null;

function SessionContent({ activity }: { activity: Activity }) {
  if (activity.id === "zone2") {
    return <div className="session-facts">
      <div className="session-fact"><ClockIcon size={22} /><div><span>Duración</span><strong>45–60 <small>minutos</small></strong></div></div>
      <div className="session-fact"><ActivityIcon activity="hiit" size={25} /><div><span>Tipo de sesión</span><strong>Cardio continuo</strong></div></div>
    </div>;
  }
  if (activity.id === "hiit") {
    return <div className="interval-guide">
      <div className="interval-key"><span className="intense-dot" />4 min intensos<span className="recovery-dot" />3–4 min de recuperación</div>
      <div className="interval-track" aria-label="Cuatro intervalos de cuatro minutos intensos, con recuperación entre ellos">
        {[1, 2, 3, 4].map((round) => <div className="interval-round" key={round}>
          <div className="intense-block"><strong>4 min</strong><span>Intervalo {round}</span></div>
          {round < 4 && <div className="recovery-block"><span>3–4</span><span>min</span></div>}
        </div>)}
      </div>
    </div>;
  }
  if (activity.id === "rest") {
    return <div className="rest-message"><ActivityIcon activity="rest" size={34} /><p>Descansar también es parte de la rutina.</p></div>;
  }
  return <div className="strength-note"><DumbbellIcon size={24} /><p>La rutina indica el grupo corporal. Los ejercicios, las series y las repeticiones están por definir.</p></div>;
}

function WeekSkeleton() {
  return <div className="loading-week" role="status">
    <CalendarIcon size={26} />
    <span>Preparando tu semana…</span>
    <span className="loading-line" />
  </div>;
}

export function WeeklyRoutine() {
  const [view, setView] = useState<ViewState>(null);

  useEffect(() => {
    const refresh = () => {
      const week = getWeekModel();
      setView((previous) => previous?.week.todayKey === week.todayKey
        ? previous : { week, selectedIndex: week.todayIndex });
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function selectDay(index: number, reveal = true) {
    setView((previous) => previous ? { ...previous, selectedIndex: index } : previous);
    if (reveal && window.matchMedia("(max-width: 700px)").matches) {
      window.requestAnimationFrame(() => document.getElementById("session-detail")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      }));
    }
  }

  function handleDayKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % 7, ArrowLeft: (index + 6) % 7, Home: 0, End: 6,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectDay(next, false);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(".calendar-day");
    buttons?.[next]?.focus();
  }

  const week = view?.week;
  const selectedDay = view ? view.week.days[view.selectedIndex] : null;
  const selectedActivity = selectedDay ? ACTIVITIES[selectedDay.activityId] : null;
  const selectedIsToday = selectedDay?.dateKey === week?.todayKey;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#week">Ir a la semana</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Mi rutina, inicio">
          <span className="brand-mark"><DumbbellIcon size={26} /></span>
          <span>mi rutina<span className="brand-period">.</span></span>
        </a>
        <div className="header-note"><ActivityIcon activity="rest" size={23} /><span>Constancia, a tu ritmo.</span></div>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Fuerza + cardio</h1>
            <p>Tu entrenamiento, un día a la vez.</p>
          </div>
          <div className="date-label">
            <CalendarIcon size={21} />
            <div><span>Esta semana</span><strong>{week?.rangeLabel ?? "Lunes a domingo"}</strong></div>
          </div>
        </section>

        <section className={"week-sheet routine-" + (week?.routine ?? 1)} id="week" aria-label="Calendario de la semana actual" aria-busy={!view}>
          {week && view ? <>
            <div className="week-heading">
              <div className="routine-overview">
                <span className="routine-badge">Rutina {week.routine}</span>
                <p><strong>{week.routine === 1 ? "2" : "1"}</strong> de tren superior <span className="focus-divider">/</span> <strong>{week.routine === 1 ? "1" : "2"}</strong> de tren inferior</p>
              </div>
              <div className="week-number">Semana {week.isoWeek}<span className="parity">{week.isoWeek % 2 === 0 ? "Par" : "Impar"}</span></div>
            </div>

            <div className="week-days" role="group" aria-label="Elige un día para consultar su entrenamiento">
              {week.days.map((day, index) => {
                const activity = ACTIVITIES[day.activityId];
                const isToday = day.dateKey === week.todayKey;
                const isSelected = index === view.selectedIndex;
                return <button type="button"
                  className={"calendar-day" + (isToday ? " is-today" : "") + (isSelected ? " is-selected" : "")}
                  key={day.dateKey}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-controls="session-detail"
                  aria-label={day.fullDate + ": " + activity.title + (isToday ? ". Hoy" : "")}
                  onClick={() => selectDay(index)}
                  onKeyDown={(event) => handleDayKey(event, index)}
                >
                  <span className="day-top"><span className="day-name">{day.name}</span>{isToday && <span className="today-tag"><span />Hoy</span>}</span>
                  <span className="day-number">{day.dayNumber.toString().padStart(2, "0")}</span>
                  <span className={"activity-circle tone-" + activity.color}><ActivityIcon activity={day.activityId} size={54} /></span>
                  <span className="day-activity">{activity.calendarTitle}</span>
                  <span className="day-meta">{activity.id === "upper" || activity.id === "lower" ? activity.category : activity.calendarMeta}</span>
                  <span className="day-bottom"><span>{isSelected ? "Viendo detalle" : "Ver detalle"}</span><ArrowIcon size={16} /></span>
                </button>;
              })}
            </div>
            <div className="calendar-caption"><span className="caption-mark" />Toca un día para explorar tu entrenamiento.</div>
          </> : <WeekSkeleton />}
        </section>

        {week && view && selectedDay && selectedActivity && <div className="lower-grid">
          <section id="session-detail" className={"session-detail tone-" + selectedActivity.color} aria-labelledby="session-title" aria-live="polite" aria-atomic="true">
            <div className="detail-date"><span>{selectedDay.fullDate}</span>{selectedIsToday && <span className="detail-today">Hoy</span>}<a className="choose-day" href="#week">Cambiar día</a></div>
            <div className="detail-main" key={selectedDay.dateKey}>
              <span className="detail-icon"><ActivityIcon activity={selectedActivity.id} size={60} /></span>
              <div className="detail-copy"><span className="category-label">{selectedActivity.category}</span><h2 id="session-title">{selectedActivity.title}</h2><p>{selectedIsToday ? selectedActivity.description : selectedActivity.description.replace("Hoy corresponde", "Corresponde").replace("Hoy no hay", "No hay")}</p></div>
            </div>
            <SessionContent activity={selectedActivity} />
            {!selectedIsToday && <button className="back-today" type="button" onClick={() => selectDay(week.todayIndex)}>Volver a hoy<ArrowIcon size={17} /></button>}
          </section>

          <aside className="cycle-panel" aria-labelledby="cycle-title">
            <div className="cycle-title"><CycleIcon size={21} /><h2 id="cycle-title">Un ciclo de dos rutinas</h2></div>
            <p className="cycle-intro">La fuerza alterna cada semana. <br />El cardio y el descanso se mantienen.</p>
            <div className={"cycle-row" + (week.routine === 1 ? " active" : "")}>
              <span className="cycle-number sage-number">1</span>
              <div><div className="cycle-row-title"><strong>Rutina 1</strong>{week.routine === 1 && <span>Esta semana</span>}</div><p>2 superior / 1 inferior</p><small>Semanas pares</small></div>
              {week.routine === 1 && <span className="active-cycle-dot" />}
            </div>
            <div className={"cycle-row" + (week.routine === 2 ? " active" : "")}>
              <span className="cycle-number lavender-number">2</span>
              <div><div className="cycle-row-title"><strong>Rutina 2</strong>{week.routine === 2 && <span>Esta semana</span>}</div><p>2 inferior / 1 superior</p><small>Semanas impares</small></div>
              {week.routine === 2 && <span className="active-cycle-dot" />}
            </div>
            <details className="cycle-explanation"><summary>¿Cómo cambia la rutina?<span aria-hidden="true">+</span></summary><p>Cambia los lunes según el número de semana ISO, con la fecha de Colombia. Una semana 53 seguida de una semana 1 mantiene la rutina 2.</p></details>
          </aside>
        </div>}

        <div className="plan-note"><InfoIcon size={17} /><p>Una guía para consultar tu rutina. Los detalles de fuerza y las pulsaciones objetivo no están definidos.</p></div>
        <noscript><p className="noscript-note">Activa JavaScript para calcular la semana actual y consultar los días de entrenamiento.</p></noscript>
      </main>

      <footer className="site-footer"><span>Un poco de fuerza. Un poco de cardio. Tu equilibrio.</span><span className="timezone"><span />Fecha de Colombia</span></footer>
    </div>
  );
}
