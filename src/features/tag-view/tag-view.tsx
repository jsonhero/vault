import { sql } from "kysely"
import { useDbQuery } from "~/query-manager"
import { DocumentEditor } from "../document-editor"
import { EntityEditor } from "../entity-editor"

export const TagView = ({ tag }) => {
  const { data } = useDbQuery({
    keys: [tag],
    query: () => sql<{ entity_id: number, block_id: string }>`
    SELECT 
      document.entity_id, 
      json_extract(block.value, '$.blockId') as block_id
    FROM 
      document,
      json_each(manifest, '$.taggedBlocks' ) as block,
      json_each(json_extract(block.value, '$.tags')) as item
    WHERE item.value = ${sql.val(tag)}
      `,
    enabled: tag.length
  })

  

  return (
    <div>
      <div className="font-bold text-xl text-green-500">
        Occurences of: #{tag}
      </div>
      {data.map((d) => {
        return (
          <div className="mt-10">
            <EntityEditor entityId={d.entity_id} selectedBlockId={d.block_id} />
          </div>
        )
      })}
    </div>
  )
}