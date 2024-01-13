


# TODO


#### Phases

1. Basic MVP (3 Months)

* Text editor (markdown, commands, nodes, plugins)
* Table editor (Filtering, sorting, views)
* File tree
* Tab system
* Linking/Refs
* Extension demo
* Data Graphing demo


2. Usable MVP (3 Months)
* Overhaul UI
* Infinite canvas (React flow?)
* Link graph view
* Data Replication
* Realtime Collaboration


3. Releaseable MVP (3 Months)
* Partial Data Replication
* Extendable API
* Documentation



#### Random

- Setup prosemirror again with React ( :DDDD )
- Add simple title editing

- Figure out app state persistence

- Think through search
  - Title, document text, searchable table text columns
- 
- Think through file tree explorer
  - Can put table row, doc, table in tree.
- Add more table input types (number, document, text{searchable})
- Add table filtering and views
- Add scripting
- References
  - Inline doc refs
  - Table refs
    - Where are table refs set when there's no doc? Can they be set? Probably. Just show it in the table somewhere?
  - Show back/to ref links 
  - Start thinking about adding Extensions
    - Can be coupled with a table somehow
      - Todo schema declaration
      - Todo texteditor block extension view
        - Has actions that update the table
      - How do to query text blocks?
        - Maybe also have a Todo table extension row view
      - Todo would have a reference to the note its created on
- Add markdown editing like Obsidian


- Figure out react renderse for prosemirror... how to handle passing state from pluginstate to react? For example, long dyanaimc lists that mount and need to select one item with keyboard inputs. MObx Observers in portal states might not work?


##### Text Editor
- fix react flushSync issue when changing docs, this may be an issue with the react prosemirror adapter.
- Make decision on WSIWYG or WSIWYG-lite (obsidian syntax)
  - Maybe WSIWYG with virtual characters for block markdown styling

##### Search

- Add fallback FTS index when query is < 3 characters since it won't able to use the trigram tokenzier, probs just use default tokenizer.
- Implement custom query match highlighting since SQLite highlight() isn't great, and isn't good with a ui framework.
- Include spaces where doc_text new line characters should be
- Add doc_text snippet() SQLite aux function for narrowing down large documents.
- Maybe add a spellfix index to enable fuzzy search. I think it would work by first parsing the search query words, hitting the spellfix index to get a list of auxillary terms, and then hit the FTS index with those terms.
- Maybe use https://github.com/pacocoursey/cmdk

https://www.sqlite.org/fts5.html
https://www.sqlite.org/spellfix1.html
