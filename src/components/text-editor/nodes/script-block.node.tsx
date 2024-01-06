import { useNodeViewContext } from "@prosemirror-adapter/react";
import { useState } from "react";




export const ScriptBlockNode = () => {
  const {
    contentRef,
    node
  } = useNodeViewContext()
  const [computedValue, setComputedValue] = useState<string | undefined>(undefined);

  const onRunCode = () => {
    let frame = document.createElement("iframe")
    frame.setAttribute("sandbox", "allow-scripts allow-popups allow-modals allow-forms allow-same-origin")
    frame.src = "/sandbox.html"
    let code = node.textContent
    console.log(node.textContent)
    let channel = new MessageChannel()
    channel.port2.onmessage = event => {
      setComputedValue(JSON.stringify(event.data.value))
    }
    frame.onload = () => {
      frame.contentWindow?.postMessage({ type: "load", code }, "*", [channel.port1])
    }

    document.body.appendChild(frame)
  }
  

  
  return (
    <div className="w-full bg-amber-200" contentEditable={false}>
      <div className="rounded-md overflow-hidden" ref={contentRef}>
      </div>
      <button onClick={onRunCode} contentEditable={false}>Run Code</button>
      {computedValue !== undefined && <div className="py-2">{computedValue}</div>}
    </div>
  )
}