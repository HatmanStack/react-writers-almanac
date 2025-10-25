import { memo, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
}

const baseClasses =
  'cursor-pointer font-bold transition-colors duration-200 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-app-container text-app-text hover:bg-opacity-90 px-4 py-2 rounded-lg border-none',
  secondary:
    'bg-transparent border-2 border-app-container text-app-text hover:bg-app-container hover:bg-opacity-20 px-4 py-2 rounded-lg',
  text: 'bg-transparent border-none text-app-text hover:text-opacity-80',
};

const Button = memo(function Button({
  variant = 'text',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
});

export default Button;
