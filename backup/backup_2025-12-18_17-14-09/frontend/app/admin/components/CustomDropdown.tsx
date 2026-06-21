"use client";

import { useState, useEffect, useRef } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "-- Pilih --",
  disabled = false,
  className = "",
  required = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      
      // Check if dropdown fits below, if not position it above
      const checkPosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const dropdownHeight = Math.min(options.length * 36 + 16, 200); // Approximate height
          
          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            setDropdownPosition('top');
          } else {
            setDropdownPosition('bottom');
          }
        }
      };
      
      // Check position after a small delay to ensure DOM is updated
      setTimeout(checkPosition, 0);
      
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, options.length]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full pl-3 pr-9 py-2 h-[38px] text-xs border border-slate-300 rounded-xl 
          focus:ring-2 focus:ring-[#EEC0A3] focus:border-[#EEC0A3] 
          transition-all text-slate-900 bg-white text-left flex items-center justify-between 
          hover:border-slate-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-[#EEC0A3] ring-2 ring-[#EEC0A3]' : ''}
        `}
      >
        <span className={`${selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
          {displayText}
        </span>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDownIcon />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div 
            ref={dropdownRef}
            className={`absolute z-[100] w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-1.5 ${
              options.length > 5 
                ? 'max-h-[200px] overflow-y-auto' 
                : '' // No max-height if 5 or fewer options - show all
            } ${
              dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 text-left text-xs text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                  value === option.value ? "bg-slate-50" : ""
                }`}
              >
                {value === option.value ? (
                  <svg
                    className="w-4 h-4 text-slate-900 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <div className="w-4 h-4 flex-shrink-0"></div>
                )}
                <span className="flex-1">{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

