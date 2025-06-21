export const SERVICES = [
  {
    id: 1,
    name: "00000 Initial Consultation - No Charge",
    details: "15 min · $0",
  },
  {
    id: 2,
    name: "90791 Psychiatric Diagnostic Evaluation",
    details: "50 min · $100",
  },
];

export const ALL_SERVICES = [
  ...SERVICES,
  {
    id: 3,
    name: "90847 Family psychotherapy, conjoint psychotherapy with the patient present",
    details: "",
  },
  {
    id: 4,
    name: "90853 Group Therapy",
    details: "",
  },
  {
    id: 5,
    name: "90887 Collateral Visit",
    details: "",
  },
  {
    id: 6,
    name: "90899 Unlisted psychiatric service or procedure",
    details: "",
  },
  {
    id: 7,
    name: "97110 Therapeutic exercises",
    details: "",
  },
  {
    id: 8,
    name: "97530 Therapeutic activities, direct (one-on-one) patient contact (use of dynamic activities to improve functional performance), each 15 minutes",
    details: "",
  },
];

export type Service = (typeof SERVICES)[0];
