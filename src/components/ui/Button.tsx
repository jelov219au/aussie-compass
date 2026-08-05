import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonBaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
};

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  type?: undefined;
  onClick?: undefined;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy-light focus-visible:ring-navy border border-navy",
  secondary:
    "bg-white text-navy border border-border hover:border-navy/30 hover:bg-surface focus-visible:ring-navy",
  ghost:
    "bg-transparent text-navy border border-transparent hover:bg-surface focus-visible:ring-navy",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", onClick } = props as ButtonAsButton;

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
