import { ReservationActionContent } from "../ReservationActionContent";

interface ContactStepProps {
  unitNumber: string;
  email: string;
  onEmailChange(email: string): void;
  onBack(): void;
  onSendCode(): void;
  loading: boolean;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function ContactStep({ loading, unitNumber, email, onEmailChange, onBack, onSendCode }: ContactStepProps) {
  const validEmail = isValidEmail(email);

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 3 of 7 <span aria-hidden="true">·</span> Contact
        </p>
      </header>

      <div className="reservation-step-scroll contact-step-scroll">
        <section className="contact-step-intro">
          <h2>Where should we send the reservation?</h2>
          <p>We will send a six-digit code to confirm this address. Reservation documents for unit {unitNumber} will also be sent to the same inbox.</p>
        </section>

        <div className="reservation-field">
          <label htmlFor="reservation-email">
            Email address <span aria-hidden="true">*</span>
          </label>
          <input
            id="reservation-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            aria-describedby="reservation-email-hint"
            required
          />
          <small id="reservation-email-hint">Enter the email address you want to use for this reservation.</small>
        </div>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!validEmail || loading} aria-busy={loading} onClick={onSendCode}>
          <ReservationActionContent loading={loading} label="Send code" loadingLabel="Sending..." />
        </button>
      </footer>
    </div>
  );
}
