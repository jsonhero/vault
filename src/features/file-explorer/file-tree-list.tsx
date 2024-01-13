import _ from "lodash"
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon, FileTextIcon, Table2Icon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useImmer } from "use-immer"
import { Menu } from "@ark-ui/react";

import type { FileTreeNode } from './file-explorer'
import { useDatabase } from "~/context";

const ListItemFolder = ({
  item,
  onClickListItem,
  selected
}: any) => {

  const onClick = useCallback(() => {
    onClickListItem(item.id)
  }, [item.id, onClickListItem])

  // todo add folder line with height of children depth using line svg

  return (
    <ListItem depth={item.depth} onClick={onClick} selected={selected} data-node-id={item.id} data-node-type="folder">
      <div className="folder pointer-events-none">
        <button className="flex items-center gap-1">
          {item.meta.expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
          <FolderIcon size={14} />
          <div>{item.name}</div>
        </button>
      </div>
    </ListItem>
  )
}

const ListItemFile = ({
  item,
  onClickListItem,
  selected,
}) => {
  const onClick = useCallback(() => {
    onClickListItem(item.id)
  }, [item.id, onClickListItem])

  return (
    <ListItem depth={item.depth} onClick={onClick} selected={selected} data-node-id={item.id} data-node-type="file">
      <div className="pointer-events-none">
        <button className="flex items-center gap-1">
          {item.entity.type === 'document' ? <FileTextIcon size={14} /> : <Table2Icon size={14} />}
          <div>{item.entity.title}</div>
        </button>
      </div>
    </ListItem>
  )
}

const ListItem = ({ depth, children, selected, ...props }) => {
  const pixelPadding = depth * 12 + 4

  return (
    <li className="hover:bg-zinc-800 h-[24px] flex items-center cursor-pointer" style={{
      paddingLeft: pixelPadding + 'px',
      background: selected && 'rgba(255, 255, 255, 0.15)',
    }} {...props}>
      {children}
    </li>
  )
}

const FolderMenu = ({
  anchorPoint,
  nodeType,
  nodeId,
  onAddFile,
  onAddFolder,
  onCloseMenu,
  onDeleteNode,
  onOpenItem,
}) => {
  const list = useMemo(() => {
    if (nodeType === 'file') {
      return [{
        groupId: '1',
        children: [
          {
            id: 'open_file',
            name: 'Open',
          },
          {
            id: 'delete',
            name: 'Delete',
          }
        ]
      }]
    } else {
      return [{
        groupId: '2',
        children: [
          {
            id: 'new_document',
            name: 'New Document',
          },
          {
            id: 'new_table',
            name: 'New Table',
          },
          {
            id: 'new_folder',
            name: 'New Folder',
          },
          {
            id: 'delete',
            name: 'Delete',
          }
        ]
      }]
    }
  }, [nodeType])

  const onSelect = useCallback(({ value }: any) => {
    if (value === 'new_document') {
      onAddFile(nodeId, 'document')
    } else if (value === 'new_table') {
      onAddFile(nodeId, 'table')
    } else if (value === 'new_folder') {
      onAddFolder(nodeId)
    } else if (value === 'delete') {
      onDeleteNode(nodeId)
    } else if (value === 'open_file') {
      onOpenItem(nodeId)
    }

    onCloseMenu()
  }, [nodeId, onAddFile, onAddFolder, onDeleteNode, onOpenItem])

  
  return (
    <Menu.Root open={anchorPoint} anchorPoint={anchorPoint} onSelect={onSelect} loop>
      <Menu.Positioner>
        <Menu.Content className="bg-primary w-[230px] p-3 shadow-md rounded-md font-normal text-sm z-20">
          {list.map((group => (
            <Menu.ItemGroup id={group.groupId} key={group.groupId}>
              {group.children.map((item) => (
                <Menu.Item id={item.id} key={item.id} className="data-[highlighted]:bg-zinc-800 p-[2px]">{item.name}</Menu.Item>
              ))}
            </Menu.ItemGroup>
          )))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}

interface FolderTreeListProps {
  list: FileTreeNode[]
}

export const FolderTreeList = ({
  list,
  selectedNodeId,
  onAddFile,
  onAddFolder,
  onClickItem,
  onDeleteNode,
}: FolderTreeListProps) => {
  const [menuProps, setMenuProps] = useState<any>({})

  const onRightClickWindow = (e: React.MouseEvent<HTMLDivElement>) => {
    const nodeId = e.target.dataset.nodeId
    const nodeType = e.target.dataset.nodeType

    setMenuProps({
      nodeId,
      nodeType: nodeType || 'window',
      anchorPoint: {
        x: e.clientX,
        y: e.clientY,
      }
    })
    e.preventDefault()
  }

  const onCloseMenu = () => {
    setMenuProps({})
  }

  return (
    <div className="min-h-[200px] h-full py-3 px-3 pb-10 border-b-1 border-blue-950" onContextMenu={onRightClickWindow}>
      <ul className="tree">
        {
          list.map((node) => {
            if (node.type === 'file') {
              return (
                <ListItemFile 
                  item={node} 
                  onClickListItem={onClickItem} 
                  selected={node.id === selectedNodeId} 
                />
              )
            }
            return (
              <ListItemFolder 
                item={node} 
                onClickListItem={onClickItem} 
                selected={node.id === selectedNodeId} 
              />
            )
          })
        }
      </ul>
      <FolderMenu 
        {...menuProps} 
        onAddFile={onAddFile} 
        onAddFolder={onAddFolder} 
        onCloseMenu={onCloseMenu}
        onDeleteNode={onDeleteNode}
        onOpenItem={onClickItem}
      />
    </div>
  )
}