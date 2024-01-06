import { ReactEventHandler } from 'react'
import { Input } from '~/components/input'
import { useDatabase } from '~/context'

import { Entity } from '~/types/db-types'

interface TitleEditorProps {
  entity: Entity
}

export const TitleEditor = ({
  entity
}: TitleEditorProps) => {
  const db = useDatabase()

  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement> ) => {
    const value = e.target.value

    db.execute('UPDATE entity SET title = ? WHERE id = ?', [value, entity.id])
  }


  return (
    <Input value={entity.title || ''} className="font-bold mb-2 text-3xl" onChange={onChangeTitle}/>
  )
}