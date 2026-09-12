export function SchoolMedia({
  src,
  alt,
  label,
  priority = false,
  className = "",
}: {
  src?: string;
  alt: string;
  label: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`school-media ${className}`}>
      {src ? (
        <img
          decoding="async"
          src={src}
          alt={alt}
          width={1600}
          height={1200}
          sizes="(max-width: 768px) 100vw, 60vw"
          loading={priority ? "eager" : "lazy"}
          style={{
            objectFit: "cover",
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      ) : (
        <div
          className="media-placeholder"
          aria-label="Espaço reservado para fotografia da escola"
        >
          <span className="media-circle" />
          <span className="media-arch" />
          <span className="media-line" />
          <span className="media-label">
            {label}
            <small>Fotografia da escola em breve</small>
          </span>
        </div>
      )}
    </div>
  );
}
