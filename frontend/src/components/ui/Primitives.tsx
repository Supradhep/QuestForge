import React, { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none';

  const variants: Record<string, string> = {
    primary:
      'bg-[#E5A93C] hover:bg-[#EDA834] active:scale-[0.99] text-[#0B0B0E] font-semibold',
    secondary:
      'bg-[#16161D] hover:bg-[#1E1E28] text-[#EDEDEF] border border-white/[0.08]',
    outline:
      'bg-transparent hover:bg-white/[0.04] text-[#EDEDEF] border border-white/[0.12]',
    ghost:
      'bg-transparent hover:bg-white/[0.05] text-[#8E8E99] hover:text-white',
    danger:
      'bg-[#E5484D]/15 hover:bg-[#E5484D]/25 text-[#FF8589] border border-[#E5484D]/30',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-sm px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}> = ({ children, className = '', noPadding = false }) => (
  <div
    className={`bg-[#131318] border border-white/[0.07] rounded-2xl ${
      noPadding ? '' : 'p-6 sm:p-8'
    } ${className}`}
  >
    {children}
  </div>
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ isOpen, onClose, title, subtitle, children, footer }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#131318] border border-white/[0.1] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif-display text-2xl text-white">{title}</h3>
            {subtitle && <p className="text-xs text-[#8E8E99] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#8E8E99] hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2">{children}</div>

        {footer && (
          <div className="px-6 py-4 mt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const LoadingState: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Loading...',
  subtitle,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
    <Loader2 className="w-5 h-5 text-[#E5A93C] animate-spin mb-3" />
    <div className="font-serif-display text-2xl text-white">{title}</div>
    {subtitle && <p className="text-xs text-[#8E8E99] mt-1">{subtitle}</p>}
  </div>
);
