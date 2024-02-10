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
  simple?: boolean
}

export const BlockEditor = React.memo((props: BlockEditorProps) => {

  const editor = useEditor({
    doc: props.documentJson ?? generateDefaultDoc(),
    onUpdate({
      state
    }) {
      props.onUpdate(state)
    },
    nodes: [
      ...nodes,
      ...props.extensions.flatMap((ext) => ext.props.prosemirror.nodes)
    ],
    extensions: [
      GutterExtension.configure({
        hideLineNumbers: props.simple
      }),
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
        <div className='editor-gutter min-w-[60px]'>
          
        </div>
        <EditorContent className="min-w-[220px]" editor={editor} />
      </div>
    </div>
  )
}, (prevProps, nextProps) => prevProps.renderId === nextProps.renderId)