import { memo } from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article' | 'main';
}

const roundedClasses: Record<NonNullable<ContainerProps['rounded']>, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

const paddingClasses: Record<NonNullable<ContainerProps['padding']>, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const Container = memo(function Container({
  children,
  className = '',
  rounded = 'lg',
  padding = 'md',
  as: Component = 'div',
}: ContainerProps) {
  const baseClasses = 'z-10 bg-app-container';
  const classes =
    `${baseClasses} ${roundedClasses[rounded]} ${paddingClasses[padding]} ${className}`.trim();

  return <Component className={classes}>{children}</Component>;
});

export default Container;
