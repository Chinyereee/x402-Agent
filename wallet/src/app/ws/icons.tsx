// Thin line icons for the workspace (same family as the side nav icons elsewhere).
export const I = {
  new: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  chat: "M4 5h16v11H9l-5 4z",
  home: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
  rules: "M6 4h12v16H6zM9 9h6M9 13h6M9 17h3",
  pay: "M3 7h18v11H3zM3 11h18M7 15h3",
  gear: "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2m10-10 2-2",
  fold: "M15 6l-6 6 6 6",
  unfold: "M9 6l6 6-6 6",
  split: "M3 5h18v14H3zM14 5v14",
  wide: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  close: "M6 6l12 12M18 6 6 18",
  mic: "M9 3h6v11H9zM5 11a7 7 0 0 0 14 0M12 18v3",
  menu: "M4 7h16M4 12h16M4 17h16",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  job: "M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14",
  guide: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  out: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
};

export function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
