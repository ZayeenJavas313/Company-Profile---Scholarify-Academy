"use client";

import { useState, useEffect, useRef } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Helper functions
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const endOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  return new Date(d.setDate(diff));
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const subMonths = (date: Date, months: number): Date => {
  return addMonths(date, -months);
};

const eachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = new Date(interval.start);
  while (current <= interval.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const formatDisplayDate = (date: Date): string => {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pilih tanggal",
  disabled = false,
  minDate,
  maxDate,
  className = ""
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseDate(value) : null;
  
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDate(date);
    
    // Check min/max constraints
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    handleDateSelect(today);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const displayValue = selectedDate 
    ? formatDisplayDate(selectedDate)
    : "";

  // Get all days for current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-xs border border-slate-300 rounded-xl 
          focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] 
          transition-all text-slate-900 bg-white text-left
          hover:border-slate-400
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
          ${isOpen ? 'border-[#EEC0A3] ring-2 ring-[#EEC0A3]' : ''}
        `}
      >
        <span className={displayValue ? "text-slate-900 font-medium" : "text-slate-400"}>
          {displayValue || placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-20 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[300px]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {MONTH_NAMES[currentMonth.getMonth()]}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {currentMonth.getFullYear()}
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="text-[10px] font-semibold text-slate-500 text-center py-1.5"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);
                const dateStr = formatDate(day);
                const isDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));

                return (
                  <button
                    key={`${day.getTime()}-${index}`}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    disabled={isDisabled}
                    className={`
                      w-9 h-9 text-xs rounded-lg transition-all duration-150
                      flex items-center justify-center font-medium
                      ${!isCurrentMonth 
                        ? "text-slate-300 cursor-not-allowed" 
                        : isSelected
                        ? "bg-gradient-to-br from-[#EEC0A3] to-[#D9A684] text-white shadow-sm font-bold"
                        : isCurrentDay
                        ? "bg-blue-50 text-blue-600 font-semibold border border-blue-200"
                        : "text-slate-700 hover:bg-slate-100"
                      }
                      ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-xs font-medium text-[#D9A684] hover:text-[#c68b65] transition-colors px-2 py-1"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
