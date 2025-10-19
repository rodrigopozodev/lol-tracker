import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const Button: React.FC<Props> = ({ className = "", variant = "primary", disabled, ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const primary = "bg-primary text-primary-foreground hover:bg-primary/90 ring-1 ring-ring/20 hover:ring-ring/30 shadow-sm hover:shadow-md";
  const secondary = "border border-border/50 bg-transparent text-foreground hover:border-primary hover:bg-primary/10 ring-1 ring-ring/10";
  const styles = `${base} ${variant === "primary" ? primary : secondary} ${className}`;

  return (
    <button {...props} className={styles} disabled={disabled} />
  );
};

export default Button;
