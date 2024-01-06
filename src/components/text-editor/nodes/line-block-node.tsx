import { useNodeViewContext } from "@prosemirror-adapter/react"


export const LineBlockNode = () => {
  const { contentRef, selected, setAttrs, node } = useNodeViewContext()
  return (
    <div className="text-slate-800" ref={contentRef} />
  )
}