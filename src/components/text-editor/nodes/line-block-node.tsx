import { useNodeView } from '~/lib/prosemirror-react'

export const LineBlockNode = () => {
  const { contentRef } = useNodeView()
  // const { contentRef, selected, setAttrs, node, decorations } = useNodeViewContext()

  // if (node.attrs.hidden) {
  //   console.log("Im hidden!")
  // }

  return (
    <div
      className="data-[block-group-id]:border-l border-red-400 ml-1 min-w-[2px]" 
      ref={contentRef} 
      // data-block-id={node.attrs.blockId}
      // data-block-group-id={node.attrs.blockGroupId}
      style={{
        // display: node.attrs.hidden ? 'none' : undefined
      }}
     />
  )
}


// (
// * something
//   * something else
// (
//   Whatever this is
// )
// )