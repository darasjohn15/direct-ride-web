import { useMemo, useState } from 'react';
import './DriverEarnings.css';

type DailyEarning = {
  dayLabel: string;
  amount: number;
  rides: number;
};

type WeeklyEarnings = {
  weekStart: string;
  weekEnd: string;
  totalEarnings: number;
  totalRides: number;
  days: DailyEarning[];
};

const weeklyEarningsData: WeeklyEarnings[] = [
  {
    weekStart: '2026-03-23',
    weekEnd: '2026-03-29',
    totalEarnings: 684.75,
    totalRides: 28,
    days: [
      { dayLabel: 'Monday', amount: 92.5, rides: 4 },
      { dayLabel: 'Tuesday', amount: 118.25, rides: 5 },
      { dayLabel: 'Wednesday', amount: 84.0, rides: 3 },
      { dayLabel: 'Thursday', amount: 136.5, rides: 6 },
      { dayLabel: 'Friday', amount: 101.75, rides: 4 },
      { dayLabel: 'Saturday', amount: 98.25, rides: 4 },
      { dayLabel: 'Sunday', amount: 53.5, rides: 2 },
    ],
  },
  {
    weekStart: '2026-03-30',
    weekEnd: '2026-04-05',
    totalEarnings: 0,
    totalRides: 0,
    days: [
      { dayLabel: 'Monday', amount: 0, rides: 0 },
      { dayLabel: 'Tuesday', amount: 0, rides: 0 },
      { dayLabel: 'Wednesday', amount: 0, rides: 0 },
      { dayLabel: 'Thursday', amount: 0, rides: 0 },
      { dayLabel: 'Friday', amount: 0, rides: 0 },
      { dayLabel: 'Saturday', amount: 0, rides: 0 },
      { dayLabel: 'Sunday', amount: 0, rides: 0 },
    ],
  },
];

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
  const [weekIndex, setWeekIndex] = useState(0);

  const currentWeek = useMemo(() => weeklyEarningsData[weekIndex], [weekIndex]);
  const hasEarnings = currentWeek.totalEarnings > 0;

  const handlePreviousWeek = () => {
    setWeekIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextWeek = () => {
    setWeekIndex((prev) => Math.min(prev + 1, weeklyEarningsData.length - 1));
  };

  return (
    <div className="driver-earnings">
      <header className="driver-earnings__header">
        <div>
          <p className="driver-earnings__eyebrow">Driver</p>
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
            disabled={weekIndex === 0}
            aria-label="Previous week"
          >
            ←
          </button>

          <div className="week-selector__center">
            <p className="week-selector__label">
              {formatWeekRange(currentWeek.weekStart, currentWeek.weekEnd)}
            </p>
          </div>

          <button
            type="button"
            className="week-selector__arrow"
            onClick={handleNextWeek}
            disabled={weekIndex === weeklyEarningsData.length - 1}
            aria-label="Next week"
          >
            →
          </button>
        </div>
      </section>

      <section className="earnings-summary-card">
        {hasEarnings ? (
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

        {hasEarnings ? (
          <div className="daily-breakdown">
            {currentWeek.days.map((day) => (
              <div className="daily-breakdown__row" key={day.dayLabel}>
                <div className="daily-breakdown__left">
                  <p className="daily-breakdown__day">{day.dayLabel}</p>
                  <p className="daily-breakdown__rides">{day.rides} rides</p>
                </div>

                <p className="daily-breakdown__amount">${day.amount.toFixed(2)}</p>
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