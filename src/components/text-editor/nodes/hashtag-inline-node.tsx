import { useNodeViewContext } from "@prosemirror-adapter/react"



export const HashtagInlineNode = () => {
  const { contentRef } = useNodeViewContext()

  return (
    <span className="text-green-500" ref={contentRef} />
  )
}