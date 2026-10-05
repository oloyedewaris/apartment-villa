import { Loader } from "@/components/ui/Loader";
import { formatCurrency, formatToCurrencyNaira, PaymentPlan } from "../payment-plans";
import { Center } from "@chakra-ui/react";

interface PaymentPlanStepProps {
  selectedPlanId: string | null;
  onSelect(planId: string): void;
  onBack(): void;
  onContinue(): void;
  isLoading: boolean;
  paymentPlans: PaymentPlan[]
  fetchedUnit: any
}

export function PaymentPlanStep({ fetchedUnit, paymentPlans, isLoading, selectedPlanId, onSelect, onBack, onContinue }: PaymentPlanStepProps) {
  const outright_object: any = {
    title: `Outright`,
    id: 'outright',
    outright: true,
    purchase_price: fetchedUnit?.price,
  };
  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 1 of 7 <span aria-hidden="true">·</span> Payment plan
        </p>
      </header>

      <div className="reservation-step-scroll">
        <section className="reservation-step-intro">
          <h2>How would you like to pay?</h2>
          <p>Purchase price {formatToCurrencyNaira(fetchedUnit?.price)}. Choose the payment structure that suits you. You can review it again before you pay.</p>
        </section>

        <fieldset className="payment-plan-list">
          <legend>Choose a payment plan</legend>
          {isLoading ? (
            <Center minH={'30vh'}>
              <Loader />
            </Center>
          ) : (
            [outright_object, ...(paymentPlans || [])].map((plan) => {
              const selected = selectedPlanId === plan.id;
              return (
                <label key={plan.id} className={`payment-plan-card${selected ? " selected" : ""}`}>
                  <input type="radio" name="payment-plan" value={plan.id} checked={selected} onChange={() => onSelect(plan.id)} />
                  <span className="payment-plan-summary">
                    <span>
                      <strong>{plan.title || `${plan?.payment_period_in_months} Months`}</strong>
                      {plan.title !== "Outright" && <b>
                        {plan?.initial_deposit_in_value ? `${formatToCurrencyNaira(plan?.initial_deposit_in_value)}` : formatToCurrencyNaira(plan?.purchase_price)}
                      </b>}
                      {plan.title !== "Outright" && <small>Initial deposit</small>}
                    </span>
                    <span className="payment-plan-radio" aria-hidden="true" />
                  </span>
                  <span className="payment-plan-details">
                    <span>
                      <small>Purchase price</small>
                      <strong style={{ fontSize: "20px" }}>{formatToCurrencyNaira(plan?.purchase_price)}</strong>
                    </span>
                    <span>
                      <small>{plan.id === "outright" ? "Term" : "Deposit"}</small>
                      <strong style={{ fontSize: "14px" }}>
                        {plan.title === "Outright" ? 'Single payment' : `${plan?.initial_deposit_in_percentage}% · ${plan?.payment_period_in_months} months`}
                      </strong>
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </fieldset>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!selectedPlanId} onClick={onContinue}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
