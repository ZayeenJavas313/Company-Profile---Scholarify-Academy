import React from "react";

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${className}`}>
      {children}
    </button>
  );
}

export default Button;
