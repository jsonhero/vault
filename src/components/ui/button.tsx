import { forwardRef, ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
 
const button = tv({
  base: 'text-muted hover:text-normal hover:bg-interactiveHover p-1 rounded-sm',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    },
    isActive: {
      true: "text-normal"
    }
  },
  defaultVariants: {
    size: 'md',
  }
});
 
type ButtonVariants = VariantProps<typeof button> & ComponentProps<'button'>;
 
interface ButtonProps extends ButtonVariants {
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ size, isActive, className, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      className={button({ size, isActive, className })}
      {...rest}
    />
  );
});