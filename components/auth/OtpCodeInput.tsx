"use client";

import React, { useEffect, useRef } from "react";

interface OtpCodeInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export default function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 4 }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const setDigitAt = (index: number, digit: string) => {
    const next = Array.from({ length: 4 }, (_, i) =>
      i === index ? digit : (value[i] ?? ""),
    )
      .join("")
      .slice(0, 4);
    onChange(next);
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }

    if (cleaned.length > 1) {
      const sliced = cleaned.slice(0, 4);
      onChange(sliced);
      const focusIdx = Math.min(sliced.length - 1, 3);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    setDigitAt(index, cleaned);
    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        event.preventDefault();
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        event.preventDefault();
        setDigitAt(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 3) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    const focusIdx = Math.min(pasted.length - 1, 3);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3" role="group" aria-label="4-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${index + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={`h-13 w-13 sm:h-14 sm:w-14 rounded-xl border bg-white text-center text-xl font-bold tracking-widest text-slate-900 shadow-xs transition focus:outline-none focus:ring-2 ${
            hasError
              ? "border-rose-400 focus:ring-rose-500"
              : "border-slate-300 focus:border-emerald-700 focus:ring-emerald-700/30"
          } disabled:bg-slate-50 disabled:text-slate-400`}
        />
      ))}
    </div>
  );
}
