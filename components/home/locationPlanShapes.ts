export type LocationBuilding = {
  id: string;
  name: string;
  availability: string;
  href?: string;
  shape: { kind: "polygon"; points: string } | { kind: "rect"; x: number; y: number; width: number; height: number };
};

export const locationBuildings: LocationBuilding[] = [
  {
    id: "uus-volta-7-1",
    name: "Uus-Volta 7/1",
    availability: "17 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-7/",
    shape: {
      kind: "polygon",
      points:
        "444.388469 572.800744 215.512954 587.849031 211.389091 525.616331 59.740767 535.619197 73.400409 743.469204 205.818945 734.766824 203.445585 698.022239 451.572111 681.70819",
    },
  },
  {
    id: "future-development",
    name: "Future development",
    availability: "",
    shape: { kind: "polygon", points: "362.91994 377.171495 272.530715 377.171495 272.530715 200.076985 362.91994 200.076985" },
  },
  {
    id: "uus-volta-10-2",
    name: "Uus-Volta 10/2",
    availability: "5 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-10-2/",
    shape: {
      kind: "polygon",
      points:
        "84.144555 190.871915 123.429716 190.871915 123.429716 200.179572 168.255891 200.179572 168.255891 215.464052 190.668978 215.464052 190.668978 301.256369 103.133421 301.256369 103.133421 276.103905 84.144555 276.103905",
    },
  },
  {
    id: "uus-volta-10-3",
    name: "Uus-Volta 10/3",
    availability: "10 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-10-3/",
    shape: { kind: "rect", x: 104.088534, y: 36.27437, width: 242.248105, height: 100.765506 },
  },
  {
    id: "uus-volta-8-1",
    name: "Uus-Volta 8/1",
    availability: "1 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-8-1/",
    shape: { kind: "polygon", points: "717.407584 376.484066 627.100025 376.484066 627.100025 199.142078 717.407584 199.142078" },
  },
  {
    id: "uus-volta-6-1",
    name: "Uus-Volta 6/1",
    availability: "5 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-6-1/",
    shape: { kind: "rect", x: 975.851919, y: 184.874546, width: 90.282652, height: 177.979445 },
  },
  {
    id: "uus-volta-6-2",
    name: "Uus-Volta 6/2",
    availability: "7 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-6-2/",
    shape: {
      kind: "polygon",
      points:
        "880.828909 199.418837 880.828909 183.689425 836.22643 183.689425 836.22643 174.531916 796.68739 174.531916 796.68739 260.07405 816.07985 260.07405 816.07985 285.284218 903.453396 285.284218",
    },
  },
  {
    id: "uus-volta-8-2",
    name: "Uus-Volta 8/2",
    availability: "6 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-8-2/",
    shape: {
      kind: "polygon",
      points:
        "523.686651 204.974275 523.686651 189.38794 478.922511 189.38794 478.922511 180.347759 439.582301 180.347759 439.582301 265.698899 458.597701 265.698899 458.597701 290.886527 546.255609 290.886527",
    },
  },
  {
    id: "uus-volta-8-3",
    name: "Uus-Volta 8/3",
    availability: "14 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-8-3/",
    shape: { kind: "polygon", points: "714.626738 137.90742 490.120312 137.90742 490.120312 37.156972 714.626738 37.001108" },
  },
  {
    id: "uus-volta-6-3",
    name: "Uus-Volta 6/3",
    availability: "25 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-6-3/",
    shape: { kind: "rect", x: 823.082625, y: 0, width: 243.051947, height: 101.002259 },
  },
  {
    id: "uus-volta-3",
    name: "Uus-Volta 3",
    availability: "21 available",
    href: "https://endover.ee/volta/en/houses/uus-volta-3/",
    shape: {
      kind: "polygon",
      points: "1109.719195 529.060856 1114.783752 606.097023 954.734148 616.619109 955.83935 633.430164 843.666633 640.804697 837.496868 546.957475",
    },
  },
];
