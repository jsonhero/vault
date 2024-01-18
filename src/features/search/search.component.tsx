import { Dialog, Portal } from "@ark-ui/react"
import { useCallback, useState } from "react"
import { sql } from 'kysely'
import { Input } from "~/components/input"
import { useSearchService } from './search.context'
import { observer } from 'mobx-react-lite'
import { useDbQuery } from '~/query-manager'

const sanitize = (query: string) =>
  query
    .replace(/-/g, " ")
    .split(/\s+/g)
    .map((x) => `"${x.replace(/"/g, '""')}"`)
    .join(" ");

const regex = /([^!]+)?!#!([^!]+)!#!([^!]+)?/g;

function textHighlightArray(inputText: string): any[] {
  let matches;
  const result = [];

  while ((matches = regex.exec(inputText)) !== null) {
    const beforeText = matches[1] || ""; // Use empty string if beforeText is not captured
    const capturedText = matches[2].trim();
    const afterText = matches[3] || ""; // Use empty string if afterText is not captured
  
    if (beforeText.trim() !== "") {
      result.push({ text: beforeText.trim() + " ", highlight: false });
    }
  
    result.push({ text: beforeText.length ? capturedText : " " + capturedText, highlight: true });
  
    if (afterText.trim() !== "") {
      result.push({ text: " " + afterText.trim(), highlight: false });
    }
  }
  
  
  return result.length ? result : [{ text: inputText, highlight: false }]
}

export const Search = observer(() => {
  const search = useSearchService()

  const [query, setQuery] = useState('')

  const { data: results } = useDbQuery({
    keys: [search.openProps?.entityTypeFilter, query],
    query: (db) => {
      let q = db.selectFrom('entity_fts')
        .select([
          'entity_fts.rowid', 
          sql<string>`highlight(entity_fts, 0, '!#!', '!#!')`.as('title_match'),
          sql<string>`highlight(entity_fts, 1, '!#!', '!#!')`.as('doc_match'),
        ])
        .innerJoin('entity', 'entity.id', 'entity_fts.rowid')
        .where(sql`entity_fts MATCH ${sanitize(query)}` as any)

      if (search.openProps?.entityTypeFilter) {
        q = q.where('entity.type', '=', search.openProps?.entityTypeFilter as any)
      }

      return q
    }
  })
  
  const onSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value)
  }, [])

  const onClickResult = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // maybe make helpers for accessing dataset
    const entityId = parseInt(e.currentTarget.dataset.entityId || '', 10)
    
    if (search.openProps?.onClickResult) {
      search.openProps.onClickResult(entityId)
    }
    search.close()
  }, [search.openProps?.onClickResult])


  return (
    <Dialog.Root open={search.isOpen} onOpenChange={(e) => search.toggle(e.open)}>
      <Portal>
        <Dialog.Backdrop className="absolute top-0 left-0 w-full h-full" style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(3px)'
        }}/>
        <Dialog.Positioner className="fixed flex justify-center left-0 top-0 overflow-auto w-screen h-dvh z-10">
          <Dialog.Content className="relative bg-slate-800 mt-[100px] h-[500px] w-[520px] p-8 text-white">
            <div>
              <div>
                <Dialog.Title>Search</Dialog.Title>
                <Input onChange={onSearchChange} />
              </div>
              <div>
                {results.map((d) => {
                  const titleMatches = textHighlightArray(d.title_match)
                  const docMatches = textHighlightArray(d.doc_match)

                  return (
                    <div className="p-3 my-3 border" onClick={onClickResult} data-entity-id={d.rowid}>
                      <p className="font-bold pointer-events-none" >
                        {titleMatches.map((t) => {
                          if (t.highlight) {
                            return <span className="text-blue-300">{t.text}</span>
                          }
                          return (
                            <>
                              {t.text}
                            </>
                          )
                        })}
                      </p>
                      <p className="pointer-events-none">
                        {docMatches.map((t) => {
                          if (t.highlight) {
                            return <span className="text-blue-300">{t.text}</span>
                          }
                          return (
                            <>
                              {t.text}
                            </>
                          )
                        })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})