"use client";
import { useRef, useEffect } from "react";

// A controlled 6-box OTP input. `value` is a 6-character string (may have
// blanks), `onChange` receives the new 6-character string. `wrongIndex`
// optionally highlights one box red (used after a failed verify).
export default function OtpBoxes({ value, onChange, disabled, wrongIndex, autoFocus }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, " ").split("").map((c) => (c === " " ? "" : c));

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  function handleInput(i, e) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = char || " "; // keep position with a space placeholder, never collapse
    onChange(next.join(""));
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    onChange(text.slice(0, 6));
    const lastIndex = Math.min(text.length, 6) - 1;
    refs.current[lastIndex]?.focus();
  }

  return (
    <div className="otp-group">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={"otp-digit" + (wrongIndex === i ? " wrong" : "")}
          value={digits[i]}
          disabled={disabled}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
