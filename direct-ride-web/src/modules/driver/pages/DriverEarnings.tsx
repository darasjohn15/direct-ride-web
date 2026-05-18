import { useEffect, useMemo, useState } from 'react';
import {
  earningsService,
  type WeeklyEarnings,
} from '../../../services/earningsService';
import { userService } from '../../../services/userService';
import { getToken, getUserIdFromToken } from '../../../types/auth';
import './DriverEarnings.css';

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  weekStart.setDate(weekStart.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDayLabel(date: string, fallback?: string): string {
  if (fallback) return fallback;

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
  });
}

function formatWeekRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  const startLabel = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const endLabel = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${startLabel} - ${endLabel}`;
}

export default function DriverEarnings() {
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekStart(new Date()));
  const [driverId, setDriverId] = useState('');
  const [currentWeek, setCurrentWeek] = useState<WeeklyEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDriverId() {
      try {
        const token = getToken();
        let currentDriverId = token ? getUserIdFromToken(token) : null;

        if (!currentDriverId) {
          const currentUser = await userService.getCurrentUser();
          currentDriverId = currentUser.id;
        }

        setDriverId(currentDriverId);
      } catch {
        setError('Unable to load driver profile.');
        setIsLoading(false);
      }
    }

    loadDriverId();
  }, []);

  useEffect(() => {
    if (!driverId) return;

    async function loadEarnings() {
      try {
        setIsLoading(true);
        setError('');

        const earnings = await earningsService.getWeeklyEarnings(
          driverId,
          toInputDateValue(selectedWeekStart)
        );

        setCurrentWeek(earnings);
      } catch {
        setCurrentWeek(null);
        setError('Unable to load earnings.');
      } finally {
        setIsLoading(false);
      }
    }

    loadEarnings();
  }, [driverId, selectedWeekStart]);

  const displayedWeek = useMemo(() => {
    const weekEnd = addDays(selectedWeekStart, 6);

    return {
      weekStart: toInputDateValue(selectedWeekStart),
      weekEnd: toInputDateValue(weekEnd),
    };
  }, [selectedWeekStart]);

  const isCurrentWeek = toInputDateValue(selectedWeekStart) === toInputDateValue(getWeekStart(new Date()));
  const hasEarnings = Boolean(currentWeek && currentWeek.totalEarnings > 0);

  const handlePreviousWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedWeekStart((prev) => addDays(prev, 7));
  };

  return (
    <div className="driver-earnings">
      <header className="driver-earnings__header">
        <div>
          <h1 className="driver-earnings__title">Earnings</h1>
          <p className="driver-earnings__subtitle">This week&apos;s performance.</p>
        </div>
      </header>

      <section className="earnings-card">
        <div className="earnings-card__header">
          <div>
            <h2>Week Selector</h2>
            <p className="earnings-card__helper">
              Review your totals and ride activity by week.
            </p>
          </div>
        </div>

        <div className="week-selector">
          <button
            type="button"
            className="week-selector__arrow"
            onClick={handlePreviousWeek}
            aria-label="Previous week"
          >
            ←
          </button>

          <div className="week-selector__center">
            <p className="week-selector__label">
              {formatWeekRange(
                currentWeek?.weekStart ?? displayedWeek.weekStart,
                currentWeek?.weekEnd ?? displayedWeek.weekEnd
              )}
            </p>
          </div>

          <button
            type="button"
            className="week-selector__arrow"
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            aria-label="Next week"
          >
            →
          </button>
        </div>
      </section>

      <section className="earnings-summary-card">
        {isLoading ? (
          <div className="earnings-empty-state">
            <h3>Loading earnings...</h3>
            <p>Your weekly totals are being refreshed.</p>
          </div>
        ) : error ? (
          <div className="earnings-empty-state">
            <h3>Earnings unavailable</h3>
            <p>{error}</p>
          </div>
        ) : hasEarnings && currentWeek ? (
          <>
            <p className="earnings-summary-card__label">Total Earnings</p>
            <h2 className="earnings-summary-card__amount">
              ${currentWeek.totalEarnings.toFixed(2)}
            </h2>
            <p className="earnings-summary-card__rides">
              {currentWeek.totalRides} rides this week
            </p>
          </>
        ) : (
          <div className="earnings-empty-state">
            <h3>No earnings yet</h3>
            <p>
              Once you complete rides for this week, your earnings and ride totals
              will show up here.
            </p>
          </div>
        )}
      </section>

      <section className="earnings-card">
        <div className="earnings-card__header">
          <div>
            <h2>Daily Breakdown</h2>
            <p className="earnings-card__helper">
              A day-by-day look at your weekly earnings.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="earnings-empty-state earnings-empty-state--secondary">
            <h3>Loading daily breakdown...</h3>
            <p>Your seven-day breakdown is on the way.</p>
          </div>
        ) : hasEarnings && currentWeek ? (
          <div className="daily-breakdown">
            {currentWeek.days.map((day) => (
              <div className="daily-breakdown__row" key={day.date}>
                <div className="daily-breakdown__left">
                  <p className="daily-breakdown__day">
                    {formatDayLabel(day.date, day.dayLabel)}
                  </p>
                  <p className="daily-breakdown__rides">{day.totalRides} rides</p>
                </div>

                <p className="daily-breakdown__amount">${day.totalEarnings.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="earnings-empty-state earnings-empty-state--secondary">
            <h3>No daily earnings to show</h3>
            <p>
              Your seven-day breakdown will appear here after you start completing
              rides.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
