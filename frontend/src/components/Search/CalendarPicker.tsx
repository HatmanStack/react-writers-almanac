import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CalendarMonth, Close } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';

import { DATE_BOUNDARIES } from '../../utils/dateMapping';

interface CalendarPickerProps {
  /** Date currently on screen, in YYYYMMDD format */
  currentDate: string;
  /** Called once a full day has been chosen */
  onDateSelect: (date: Date) => void;
}

/**
 * Parse YYYYMMDD into dayjs.
 *
 * dayjs only honours a format string when the customParseFormat plugin is
 * loaded, which this app does not load - `dayjs('20171129', 'YYYYMMDD')` is an
 * Invalid Date. Hyphenating first keeps it on the ISO path dayjs parses natively.
 */
function toDayjs(yyyymmdd: string): Dayjs {
  return dayjs(
    `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`
  );
}

const MIN_DATE = toDayjs(DATE_BOUNDARIES.MIN_DATE_STRING);
const MAX_DATE = toDayjs(DATE_BOUNDARIES.MAX_DATE_STRING);

/**
 * CalendarPicker - Toggle button and archive date calendar
 *
 * The calendar follows the date being viewed (controlled, not `defaultValue`)
 * and only reports a date once the selection is finished, so switching year or
 * month no longer navigates out from under you.
 */
const CalendarPicker = memo(function CalendarPicker({
  currentDate,
  onDateSelect,
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss on Escape or a click elsewhere, the way a popover is expected to behave.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleChange = useCallback(
    (value: Dayjs | null, selectionState?: 'partial' | 'shallow' | 'finish') => {
      // Year and month picks arrive as 'partial'/'shallow' - only a completed
      // day selection should navigate.
      if (!value || (selectionState && selectionState !== 'finish')) return;
      setIsOpen(false);
      onDateSelect(value.toDate());
    },
    [onDateSelect]
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="bg-transparent border-none cursor-pointer overflow-hidden text-app-text z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? 'Close calendar' : 'Open calendar'}
        aria-expanded={isOpen}
      >
        {isOpen ? <Close /> : <CalendarMonth />}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 rounded-2xl bg-app-container shadow-2xl">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={toDayjs(currentDate)}
              onChange={handleChange}
              minDate={MIN_DATE}
              maxDate={MAX_DATE}
              views={['year', 'month', 'day']}
              openTo="day"
              sx={{ color: '#fffff6' }}
            />
          </LocalizationProvider>
        </div>
      )}
    </div>
  );
});

export default CalendarPicker;
