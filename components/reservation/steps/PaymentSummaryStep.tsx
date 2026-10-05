import { formatToCurrencyNaira, type PaymentPlan } from "../payment-plans";

interface PaymentSummaryStepProps {
  plan: PaymentPlan;
  acceptedTerms: boolean;
  onAcceptedTermsChange(accepted: boolean): void;
  onBack(): void;
  onProceed(): void;
  fetchedUnit: any;
  documentUrl?: string
}

export function PaymentSummaryStep({ documentUrl, fetchedUnit, plan, acceptedTerms, onAcceptedTermsChange, onBack, onProceed }: PaymentSummaryStepProps) {
  const isOutright = plan?.unit_title

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 2 of 7 <span aria-hidden="true">·</span> Payment summary
        </p>
      </header>

      <div className="reservation-step-scroll payment-summary-scroll">
        <section className="payment-summary-intro">
          <h2>Payment summary</h2>
          <div className="payment-due-now">
            <small>You will pay now</small>
            <strong>{plan?.initial_deposit_in_value ? `${formatToCurrencyNaira(plan?.initial_deposit_in_value)}` : formatToCurrencyNaira(plan?.price)}</strong>
          </div>
        </section>

        <dl className="payment-summary-details">
          <div>
            <dt>Unit</dt>
            <dd>{fetchedUnit?.unit_title}</dd>
          </div>
          <div>
            <dt>Purchase price</dt>
            <dd>{formatToCurrencyNaira(fetchedUnit?.price)}</dd>
          </div>
          {!isOutright && (
            <div>
              <dt>Plan</dt>
              <dd>{`${plan?.payment_period_in_months} Months`}</dd>
            </div>
          )}
          {!isOutright && (
            <div>
              <dt>Initial Deposit</dt>
              <dd>{formatToCurrencyNaira(plan?.initial_deposit_in_value)}</dd>
            </div>
          )}

          {!isOutright && plan?.payment_frequency !== 'flexible' && (
            <div>
              <dt>{plan?.payment_frequency
                ? plan?.payment_frequency
                  ?.charAt(0)
                  .toUpperCase() +
                plan?.payment_frequency?.slice(1) +
                " Payment"
                : "Periodic Payment"}</dt>
              <dd> {formatToCurrencyNaira(plan?.periodic_payment)}</dd>
            </div>
          )}
        </dl>

        {documentUrl && <section className="payment-terms">
          <div className="payment-terms-link">
            <span>
              <span aria-hidden="true">□</span> Terms of agreement
            </span>
            <a href={`${documentUrl}`} target="_blank">View</a>
          </div>
          <label className="payment-terms-acceptance" id="payment-terms-acceptance">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => onAcceptedTermsChange(event.target.checked)} />
            <span>I have reviewed the terms of agreement, including the payment schedule and forfeiture conditions, and I accept them.</span>
          </label>
        </section>}
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={documentUrl ? !acceptedTerms : false} onClick={onProceed}>
          Proceed <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
