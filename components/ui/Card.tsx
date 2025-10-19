import React from "react";
export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded border bg-white shadow-sm ${className}`}>{children}</div>
);
export default Card;
