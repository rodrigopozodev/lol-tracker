"use client";
import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...rest
}) => {
  const base = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-md",
    "px-4",
    "py-2",
    "text-sm",
    "font-medium",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "ring-[color:var(--color-form-ring)]",
    "disabled:opacity-60",
    "disabled:cursor-not-allowed",
  ].join(" ");

  const styles = {
    primary:
      "bg-[color:var(--color-form-accent)] text-[color:var(--color-form-button-foreground)] hover:brightness-110",
    secondary:
      "bg-[color:var(--color-form-input)] text-[color:var(--color-form-foreground)] border border-[color:var(--color-form-border)] hover:bg-[color:var(--color-form-bg)]/20",
  } as const;

  const cn = [base, styles[variant], className].filter(Boolean).join(" ");

  return (
    <button className={cn} {...rest}>
      {children}
    </button>
  );
};

export default Button;