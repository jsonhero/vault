import { forwardRef, ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge'

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => {
  const className = twMerge('bg-transparent w-full focus-visible:outline-none focus-visible:border-none outline-none border-none', props.className);

  return (
    <input
      {...props}
      ref={ref}
      className={className}
    />
  );
});