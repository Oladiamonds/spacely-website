'use client';

import { useState, useEffect, useTransition } from 'react';
import { formatNaira } from '@/types';

interface Slot {
  hour: number;
  label: string;
  available: boolean;
  bookedUntilHour?: number;
}

interface DayAvailability {
  available: boolean;
  openTime?: string;
  closeTime?: string;
  minBookingHours?: number;
  pricePerHourKobo?: number;
  slots?: Slot[];
}

interface BookingCalendarProps {
  spaceId: string;
  minBookingHours: number;
  pricePerHourKobo: number;
  onSelection: (params: { date: string; startHour: number; endHour: number; totalKobo: number }) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function BookingCalendar({
  spaceId,
  minBookingHours,
  pricePerHourKobo,
  onSelection,
}: BookingCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayAvailability | null>(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  async function handleDayClick(day: number) {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    setSelectedDate(dateStr);
    setStartHour(null);
    setEndHour(null);
    setLoadingDay(true);
    setDayData(null);

    try {
      const res = await fetch(`/api/availability/${spaceId}?date=${dateStr}`);
      const data = await res.json();
      setDayData(data);
    } catch {
      setDayData({ available: false });
    } finally {
      setLoadingDay(false);
    }
  }

  function handleSlotClick(hour: number) {
    if (!dayData?.slots) return;
    const slot = dayData.slots.find((s) => s.hour === hour);
    if (!slot?.available) return;

    if (startHour === null || (startHour !== null && endHour !== null)) {
      // Start new selection
      setStartHour(hour);
      setEndHour(null);
    } else {
      // Set end hour — must be after start + min hours
      if (hour <= startHour) {
        setStartHour(hour);
        setEndHour(null);
        return;
      }
      // Validate no booked slots in range
      const rangeSlots = dayData.slots.filter(
        (s) => s.hour >= startHour && s.hour < hour,
      );
      if (rangeSlots.some((s) => !s.available)) {
        // Gap in selection — restart
        setStartHour(hour);
        setEndHour(null);
        return;
      }
      if (hour - startHour < minBookingHours) return;
      setEndHour(hour);
    }
  }

  // Fire selection callback when valid range picked
  useEffect(() => {
    if (selectedDate && startHour !== null && endHour !== null) {
      const totalHours = endHour - startHour;
      onSelection({
        date: selectedDate,
        startHour,
        endHour,
        totalKobo: totalHours * pricePerHourKobo,
      });
    }
  }, [selectedDate, startHour, endHour, pricePerHourKobo, onSelection]);

  const isPastMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  return (
    <div className="space-y-4">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isPastMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-muted-foreground hover:bg-neutral-50 disabled:opacity-30"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-muted-foreground hover:bg-neutral-50"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isPast = new Date(dateStr) < today;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isPast && handleDayClick(day)}
              disabled={isPast}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/10 hover:text-primary text-foreground'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time slot grid */}
      {selectedDate && (
        <div className="border-t border-neutral-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Select hours for {selectedDate}
          </p>

          {loadingDay ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          ) : !dayData?.available ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              This space is not available on the selected date.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {dayData.slots?.map((slot) => {
                  const inRange =
                    startHour !== null &&
                    endHour !== null &&
                    slot.hour >= startHour &&
                    slot.hour < endHour;
                  const isStart = slot.hour === startHour;
                  const isEnd = endHour !== null && slot.hour === endHour - 1;

                  return (
                    <button
                      key={slot.hour}
                      type="button"
                      onClick={() => handleSlotClick(slot.hour)}
                      disabled={!slot.available}
                      className={`h-10 rounded-xl text-xs font-medium transition-colors ${
                        !slot.available
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : inRange || isStart
                          ? 'bg-primary text-white'
                          : 'border border-neutral-200 bg-white text-foreground hover:border-primary/40 hover:text-primary'
                      }`}
                      aria-pressed={inRange || isStart}
                      aria-label={`${slot.label}${!slot.available ? ' (booked)' : ''}`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Tap start time, then end time. Min {minBookingHours}h booking.
              </p>

              {startHour !== null && endHour !== null && (
                <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    {String(startHour).padStart(2, '0')}:00 – {String(endHour).padStart(2, '0')}:00
                    {' '}({endHour - startHour} {endHour - startHour === 1 ? 'hour' : 'hours'})
                  </p>
                  <p className="text-sm text-primary font-medium mt-0.5">
                    {formatNaira((endHour - startHour) * pricePerHourKobo)}
                  </p>
                </div>
              )}

              {startHour !== null && endHour === null && (
                <p className="mt-2 text-xs text-primary">
                  Now tap an end time (min {minBookingHours}h = {String(startHour + minBookingHours).padStart(2, '0')}:00)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
