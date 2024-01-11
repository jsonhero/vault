
import { twMerge } from 'tailwind-merge'

export const BaseCell = ({ children, ...props }) => {
  const className = twMerge('flex p-1', props.className);

  return (
    <div {...props} className={className}>
      {children}
    </div>
  )
}