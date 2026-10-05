"use client";

import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ReservationActionContent } from "../ReservationActionContent";

interface VerificationStepProps {
  email: string;
  code: string;
  onCodeChange(code: string): void;
  onChangeAddress(): void;
  onBack(): void;
  onResend(): void;
  onVerify(): void;
  loading: boolean;
}

const CODE_LENGTH = 6;

export function VerificationStep({ loading, email, code, onCodeChange, onChangeAddress, onBack, onResend, onVerify }: VerificationStepProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendSeconds, setResendSeconds] = useState(15);
  const digits = Array.from({ length: CODE_LENGTH }, (_, index) => (code[index] === " " ? "" : code[index] || ""));
  const complete = /^\d{6}$/.test(code);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const updateDigit = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;
    onCodeChange(nextDigits.map((digit) => digit || " ").join(""));
    if (nextDigit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pastedCode) return;
    event.preventDefault();
    onCodeChange(pastedCode.padEnd(CODE_LENGTH, " "));
    inputs.current[Math.min(pastedCode.length, CODE_LENGTH) - 1]?.focus();
  };

  const resendCode = () => {
    if (resendSeconds > 0) return;
    onCodeChange("");
    setResendSeconds(15);
    onResend();
    inputs.current[0]?.focus();
  };

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 4 of 7 <span aria-hidden="true">·</span> Verify
        </p>
      </header>

      <div className="reservation-step-scroll verification-step-scroll">
        <section className="verification-step-intro">
          <h2>Enter your code</h2>
          <p>
            We sent six digits to <strong>{email}</strong>.{" "}
            <button type="button" onClick={onChangeAddress}>
              Change address
            </button>
          </p>
        </section>

        <div className="verification-code" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(input) => {
                inputs.current[index] = input;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              aria-label={`Verification code digit ${index + 1}`}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
            />
          ))}
        </div>

        <div className="verification-resend">
          <span>Code not arrived?</span>
          <button type="button" disabled={resendSeconds > 0} onClick={resendCode}>
            {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
          </button>
        </div>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!complete || loading} aria-busy={loading} onClick={onVerify}>
          <ReservationActionContent loading={loading} label="Verify" loadingLabel="Verifying..." />
        </button>
      </footer>
    </div>
  );
}
