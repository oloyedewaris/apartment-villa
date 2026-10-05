interface ReservationActionContentProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
}

export function ReservationActionContent({ loading, label, loadingLabel }: ReservationActionContentProps) {
  if (loading) {
    return (
      <span className="reservation-button-loading">
        <span className="reservation-button-spinner" aria-hidden="true" />
        {loadingLabel}
      </span>
    );
  }

  return (
    <>
      {label} <span aria-hidden="true">→</span>
    </>
  );
}
