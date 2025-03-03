import * as React from "react";

// ボタンのプロパティ定義
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// ボタンコンポーネント
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    // スタイルのクラス名を設定
    const variantClasses = {
      default: "bg-gray-100 hover:bg-gray-200 text-gray-800",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      outline: "bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-800",
    };

    const sizeClasses = {
      sm: "text-xs px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-base px-5 py-2.5",
    };

    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`;

    return (
      <button className={buttonClasses} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";