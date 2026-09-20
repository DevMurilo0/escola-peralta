import { school } from "@/config/school-config";

export function PortalBrand({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        "portal-brand",
        inverse ? "portal-brand-inverse" : "",
        compact ? "portal-brand-compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="portal-brand-mark">
        <img
          src={school.logo}
          width={compact ? 34 : 42}
          height={compact ? 34 : 42}
          alt=""
          decoding="async"
        />
      </span>
      <span className="portal-brand-copy">
        <strong>{school.name}</strong>
        <small>Portal do Professor</small>
      </span>
    </span>
  );
}
