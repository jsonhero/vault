import { useEffect, useState } from 'react'

import { Editor, EditorOptions } from '../editor'

export const useEditor = (options: Partial<EditorOptions>) => {
  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    setEditor(new Editor(options))
  }, [])

  useEffect(() => {
    editor?.setOptions(options)
  }, [editor, options])

  useEffect(() =>{
    return () => {
      editor?.destroy()
    }
  }, [editor])
  
  return editor
}