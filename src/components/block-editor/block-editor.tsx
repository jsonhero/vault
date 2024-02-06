import React from 'react';
import { EditorState } from 'prosemirror-state';

import { VaultExtension } from '~/extensions/todo';
import { useEditor, EditorContent } from '~/lib/vault-prosemirror/react'

import { 
  GutterExtension,
  LineblockExtension,
  KeymapExtension,
  HashtagExtension,
  ReferenceExtension,
  SlashCmdExtension,
} from './extensions'
import { nodes } from './nodes'
import { generateDefaultDoc } from './utils'

interface BlockEditorProps {
  renderId: string | null | undefined;
  documentJson: string | null | undefined;
  onUpdate: (state: EditorState) => void
  selectedBlockId?: string;
  extensions: VaultExtension[]
}


export const BlockEditor = React.memo((props: BlockEditorProps) => {

  const editor = useEditor({
    doc: props.documentJson ?? generateDefaultDoc(),
    onUpdate({
      state
    }) {
      props.onUpdate(state)
    },
    nodes,
    extensions: [
      GutterExtension,
      LineblockExtension.configure({
        selectedBlockId: props.selectedBlockId
      }),
      KeymapExtension,
      HashtagExtension,
      ReferenceExtension,
      SlashCmdExtension
    ]
  })

  return (
    <div className="block-editor" data-editor-id={editor?.id}>
      <div className="relative flex items-start editor-row">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)