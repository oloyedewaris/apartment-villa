export const queryKeys = {
  reservations: {
    all: ["reservations"] as const,
    detail: (reservationId: string) => ["reservations", reservationId] as const,
  },
  units: {
    all: ["units"] as const,
    detail: (unitNumber: string) => ["units", unitNumber] as const,
  },
};
