import { EventId, ItemTypeId } from "@/lib/data";

const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function EventIcon({ id }: { id: EventId }) {
  switch (id) {
    case "meeting":
      return (
        <svg viewBox="0 0 48 48" {...s}>
          <rect x="8" y="20" width="32" height="10" rx="2" />
          <path d="M12 30v8M36 30v8M14 16a3 3 0 1 0 0-.1M24 14a3 3 0 1 0 0-.1M34 16a3 3 0 1 0 0-.1" />
          <path d="M18 8h12v4H18z" />
        </svg>
      );
    case "birthday":
      return (
        <svg viewBox="0 0 48 48" {...s}>
          <path d="M10 40h28V26H10zM10 32c4 3 8-3 14 0s10-3 14 0" />
          <path d="M18 26v-6M24 26v-8M30 26v-6" />
          <path d="M18 16c-1.5-2 1.5-4 0-6M24 14c-1.5-2 1.5-4 0-6M30 16c-1.5-2 1.5-4 0-6" />
        </svg>
      );
    case "dinner":
      return (
        <svg viewBox="0 0 48 48" {...s}>
          <circle cx="24" cy="26" r="10" />
          <circle cx="24" cy="26" r="6" />
          <path d="M8 14v8a3 3 0 0 0 3 3v13M11 14v8M14 14v8M40 14c-3 2-4 6-4 10h4v14" />
        </svg>
      );
    case "launch":
      return (
        <svg viewBox="0 0 48 48" {...s}>
          <path d="M16 8l4 14a4 4 0 0 1-8 0l4-14zM32 8l-4 14a4 4 0 0 0 8 0l-4-14z" />
          <path d="M16 26v12M32 26v12M12 40h8M28 40h8M24 6v4M20 8l1.5 2M28 8l-1.5 2" />
        </svg>
      );
    case "social":
      return (
        <svg viewBox="0 0 48 48" {...s}>
          <rect x="10" y="10" width="28" height="28" rx="3" />
          <rect x="15" y="15" width="6" height="8" rx="1" />
          <rect x="27" y="25" width="6" height="8" rx="1" />
          <path d="M18 18v2M30 28v2" />
        </svg>
      );
  }
}

export function ItemIcon({ id }: { id: ItemTypeId }) {
  const p: Record<ItemTypeId, React.ReactNode> = {
    longTable: (
      <>
        <rect x="10" y="20" width="28" height="8" rx="1.5" />
        <path d="M14 16v-2M20 16v-2M28 16v-2M34 16v-2M14 32v2M20 32v2M28 32v2M34 32v2" />
      </>
    ),
    roundTable: (
      <>
        <circle cx="24" cy="24" r="7" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={24 + Math.cos((a * Math.PI) / 180) * 13} cy={24 + Math.sin((a * Math.PI) / 180) * 13} r="2.2" />
        ))}
      </>
    ),
    cocktail: (
      <>
        <ellipse cx="24" cy="12" rx="8" ry="2.5" />
        <path d="M24 14.5V36M16 38h16" />
      </>
    ),
    sofaSet: (
      <>
        <path d="M8 30v-8a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v8M8 30h32v6H8zM12 19v-4h24v4" />
      </>
    ),
    mahjong: (
      <>
        <rect x="14" y="14" width="20" height="20" rx="2" />
        <path d="M18 18h3v4h-3zM27 26h3v4h-3z" />
      </>
    ),
    buffet: (
      <>
        <path d="M8 30h32M10 30v8M38 30v8M14 30a6 6 0 0 1 12 0M28 30a5 5 0 0 1 10 0M20 22v2" />
      </>
    ),
    stage: (
      <>
        <rect x="10" y="8" width="28" height="16" rx="1.5" />
        <path d="M6 36h36v4H6zM24 24v12" />
      </>
    ),
    balloons: (
      <>
        <ellipse cx="18" cy="16" rx="6" ry="7" />
        <ellipse cx="30" cy="14" rx="6" ry="7" />
        <path d="M18 23l4 17M30 21l-6 19" />
      </>
    ),
    flowers: (
      <>
        <circle cx="24" cy="14" r="4" />
        <circle cx="17" cy="18" r="3.5" />
        <circle cx="31" cy="18" r="3.5" />
        <path d="M20 24h8l-1 8h-6zM24 32v6M18 40h12" />
      </>
    ),
    backdrop: (
      <>
        <rect x="10" y="8" width="28" height="26" rx="1" />
        <circle cx="19" cy="18" r="4" />
        <circle cx="29" cy="25" r="3" />
        <path d="M10 34v6M38 34v6" />
      </>
    ),
    plant: (
      <>
        <path d="M18 32h12l-2 8h-8zM24 32V18M24 20c-6-6-12-2-12-2s4 6 12 4M24 18c4-7 11-5 11-5s-3 7-11 7" />
      </>
    ),
    sign: (
      <>
        <rect x="14" y="8" width="20" height="18" rx="1" />
        <path d="M18 14h12M20 19h8M18 26l-4 14M30 26l4 14" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 48 48" {...s}>
      {p[id]}
    </svg>
  );
}
