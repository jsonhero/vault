
import { twMerge } from 'tailwind-merge'

export const BaseCell = ({ children, ...props }) => {
  const className = twMerge('flex relative h-full', props.className);

  return (
    <div {...props} className={className}>
      {children}
    </div>
  )
}