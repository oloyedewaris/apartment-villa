import { Center } from "@chakra-ui/react";
import { formatToCurrencyNaira, type PaymentPlan } from "../payment-plans";
import { Loader } from "@/components/ui/Loader";

interface ReservationSuccessProps {
  propertyName: string;
  unitNumber: string;
  email: string;
  reservedBy: string;
  plan: PaymentPlan;
  onBackToUnit(): void;
  success: boolean;
  loading: boolean
}

function inboxUrl(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain === "gmail.com") return "https://mail.google.com/mail/u/0/#inbox";
  if (["outlook.com", "hotmail.com", "live.com"].includes(domain)) return "https://outlook.live.com/mail/0/";
  if (domain === "yahoo.com") return "https://mail.yahoo.com/";
  return `mailto:${email}`;
}

export function ReservationSuccess({ loading, success, propertyName, unitNumber, email, reservedBy, plan, onBackToUnit }: ReservationSuccessProps) {
  return loading ? (
    <Center w='full' minH={'90vh'}>
      <Loader />
    </Center>
  ) : success ? (
    <div className="reservation-success">
      <div className="reservation-success-scroll">
        <span className="reservation-success-icon" aria-hidden="true">
          <span />
        </span>
        <small>{propertyName}</small>
        <h2>Check your email to continue</h2>
        <p>
          Unit {unitNumber} is held in your name for 72 hours. Everything you need next is in the message we just sent to <strong>{email}</strong>.
        </p>

        <ol className="reservation-next-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Open your offer email</strong>
              <p>Review your offer, payment information, terms and reference.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Complete payment</strong>
              <p>Follow the payment instructions in your email within the 7-day offer period.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>We confirm your allocation</strong>
              <p>Once payment is confirmed and the unit is still available, your allocation will be completed.</p>
            </div>
          </li>
        </ol>
      </div>

      <footer className="reservation-success-action">
        <a className="reservation-open-email" href={inboxUrl(email)} target="_blank" rel="noreferrer">
          Open email <span aria-hidden="true">→</span>
        </a>
        <p>
          <button type="button" onClick={onBackToUnit}>
            start again
          </button>
        </p>
      </footer>
    </div>
  ) : null;
}
