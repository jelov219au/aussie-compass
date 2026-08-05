type SectionHeadingProps = {
  id?: string;
  heading: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  id,
  heading,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <h2
        id={id}
        className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl"
      >
        {heading}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}
