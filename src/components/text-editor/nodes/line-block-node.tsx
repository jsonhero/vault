import { useNodeViewContext } from "@prosemirror-adapter/react"


export const LineBlockNode = () => {
  const { contentRef, selected, setAttrs, node } = useNodeViewContext()
  return (
    <div ref={contentRef} />
  )
}