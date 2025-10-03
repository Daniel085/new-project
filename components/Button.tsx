import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-105 active:scale-100';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-400 disabled:from-orange-300 disabled:to-orange-300 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 focus:ring-gray-400 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}