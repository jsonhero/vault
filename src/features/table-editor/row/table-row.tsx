import { ComponentProps } from "react"


interface TableRowProps extends ComponentProps<'tr'> {}

export const TableRow = ({
  children,
  ...rest
}: TableRowProps) => {
  return (
    <tr {...rest}>
      {children}
    </tr>
  )
}