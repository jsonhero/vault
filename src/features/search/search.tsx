import { Dialog, Portal } from "@ark-ui/react"
import { useState } from "react"
import { Input } from "~/components/input"
import { useDatabase, useQuery } from "~/context/database-context"

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

export const Search = ({
  setSelectedEntity
}) => {
  const db = useDatabase()
  const [isOpen, setIsOpen] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>([])

  const onSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value)

    const data = await db.execute<any>("SELECT rowid, highlight(entity_fts, 0, '!#!', '!#!') as title_match, highlight(entity_fts, 1, '!#!', '!#!') as doc_match FROM entity_fts WHERE entity_fts MATCH ?", [sanitize(value) + '*'])
    setResults(data)
  }


  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Dialog</button>
      <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
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
                      <div className="p-3 my-3 border" onClick={() => {
                        setSelectedEntity({ id: d.rowid, type: 'document' });
                        setIsOpen(false)
                      }}>
                        <p className="font-bold">
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
                        <p>
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
    </>
  )
}