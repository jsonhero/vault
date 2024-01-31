# TODO


Adding todo system..
- Create an extension
- Extension defines table schema?
- Add command for building row in schema, /todo
- This command adds a node to the document
  - This node is a custom renderer, this handles how it will edit properties of the todo
    - checkbox left side, descrpition middle, due date right...
- 


Things to figure out:


- Collaboration
  - Partial document editing

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
- Paid community extensions?

- Figure out react renderse for prosemirror... how to handle passing state from pluginstate to react? For example, long dyanaimc lists that mount and need to select one item with keyboard inputs. MObx Observers in portal states might not work?


##### Text Editor
- fix react flushSync issue when changing docs, this may be an issue with the react prosemirror adapter.
- Make decision on WSIWYG or WSIWYG-lite (obsidian syntax)
  - Maybe WSIWYG with virtual characters for block markdown styling
- Card system (essentially mini notes)
  - Allows grouping of unstructured data into a block with a #
  - Then when you click on the # it shows all those blocks
    - Maybe the # itself is just a page with back/to links (like roam,logseq)
    - can make "flashcards" from them
      - ex card: daily thoughts - dumping of unstructured info each day, with possibly structured data mixed in.
      - ex #thorns and #roses in daily journal
        - Could run all thorns and roses card entries through an AI to give weekly/monthly summary
        - How to order them by date updated/created? (index this? store it on block ele inline? (store this data in entity_graph row?))
  - Nodes will to be renderable outside of text editor context, or maybe not.. maybe can edit reference context inline.
- Every link/ref must provide surrouding context (blocks? )
  - https://hub.logseq.com/features/av5LyiLi5xS7EFQXy4h4K8/page-links-versus-tags/6br2khgoTLHoeAbvZL47Np
  - For now, load all references and their entire documents, and then pick blocks from there
    - This is not optimized at all, but will help figure out the right structure, + is more file system oriented.
- block element renders are differenet than references (they'r einline around unstructured data)
- Might need a higher block thhan <lineeblock> to represent a group of blocks??, or maybe that's meta data on the lineblock... <lineblock group={4}>

##### Canvas

2D vs 3D?

- Is canvas it's own folder system? Where do notes go that are created within it?
  - Are they blocks like affine? I don't see the value affine provides with canvas + note views. Just make then their own notes.... canvas is going to be complicated view anyways.

##### Search

- Add fallback FTS index when query is < 3 characters since it won't able to use the trigram tokenzier, probs just use default tokenizer.
- Implement custom query match highlighting since SQLite highlight() isn't great, and isn't good with a ui framework.
- Include spaces where doc_text new line characters should be
- Add doc_text snippet() SQLite aux function for narrowing down large documents.
- Maybe add a spellfix index to enable fuzzy search. I think it would work by first parsing the search query words, hitting the spellfix index to get a list of auxillary terms, and then hit the FTS index with those terms.
- Maybe use https://github.com/pacocoursey/cmdk

https://www.sqlite.org/fts5.html
https://www.sqlite.org/spellfix1.html


#### table editor
- allow custom commands for creating rows in text editor