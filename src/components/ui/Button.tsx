import Link from "next/link";
import type { ReactNode } from "react";
import { TrackedLink, type AnalyticsValue } from "@/components/analytics/TrackedLink";
import { actionClass } from "@/components/ui/actionStyles";

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
  eventName?: string;
  properties?: Record<string, AnalyticsValue>;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const classes = actionClass(variant === "ghost" ? "tertiary" : variant, className);

  if ("href" in props && props.href) {
    if (props.eventName) {
      return (
        <TrackedLink
          href={props.href}
          eventName={props.eventName}
          properties={props.properties}
          className={classes}
        >
          {children}
        </TrackedLink>
      );
    }

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
