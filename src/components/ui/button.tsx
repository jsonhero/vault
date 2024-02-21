import { forwardRef, ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
 
const button = tv({
  base: 'text-muted hover:text-normal',
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
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ size, isActive, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      className={button({ size, isActive })}
      {...rest}
    >
      {rest.children}
    </button>
  );
});