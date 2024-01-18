import React, { useEffect, useState } from 'react'
import { Input } from '~/components/input'
import { entityService } from '~/services/entity.service'

import { Entity } from '~/types/db-types'

interface TitleEditorProps {
  entity: Entity
}

export const TitleEditor = React.memo(({
  entity
}: TitleEditorProps) => {
  const [title, setTitle] = useState(entity.title || '')
  
  useEffect(() => {
    setTitle(entity.title)
  }, [entity.id, entity.title])

  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement> ) => {
    const value = e.target.value
    entityService.updateTitle(entity.id, value)
    setTitle(value)
  }

  return (
    <Input value={title} className="font-bold mb-2 text-3xl" onChange={onChangeTitle} autoFocus />
  )
}, (prevProps, nextProps) => prevProps.entity.id === nextProps.entity.id && prevProps.entity.title === nextProps.entity.title)