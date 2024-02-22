import { useCallback, useMemo, useState } from "react";
import { nanoid } from 'nanoid'
import _ from 'lodash'

import { Entity } from "~/types/db-types";
import { FolderTreeList } from './file-tree-list'
import { useDbQuery, useTakeFirstDbQuery } from "~/query-manager";
import { fileTreeService } from "~/services/file-tree.service";
import { entityService } from "~/services/entity.service";
import { useRootService } from "~/services/root.service";

export interface FileTreeNode {
  id: string;
  type: 'folder' | 'file' | 'root_folder'; 
  name: string;
  meta: {
    expanded: boolean
    entityId: number;
  }
  depth: number;
  entity: Entity;
  children: FileTreeNode[];
}

export interface FileTreeItem {
  id: string;
  type: 'folder' | 'file' | 'root_folder'; 
  name: string;
  expanded: boolean;
}


function pickEntityIds(node: FileTreeNode, entityIds: number[] = []): number[] {
  if (node.type === 'file') {
    entityIds.push(node.meta.entityId)
  } else if ((node.type === 'folder' || node.type === 'root_folder') && node.children.length) {
    node.children.forEach((node) => {
      pickEntityIds(node, entityIds)
    })
  }
  return entityIds
}

const DEFAULT_ROOT = {
  type: 'root_folder',
  children: []
}

function findNode(node: FileTreeNode, nodeId: string): FileTreeNode | null {
  if (node.id === nodeId) {
    return node
  }

  if (node.type != 'file' && node.children.length) {
    for (const n of node.children) {
      const match = findNode(n, nodeId)
      if (match) {
        return match
      }
    }
  }
  return null
}

function isParentOfNode(node: FileTreeNode, nodeId: string) {
  return node.children?.some(child => child.id === nodeId);
}

function findParentNode(node: FileTreeNode, nodeId: string): FileTreeNode | null {
  if (node.type != 'file' && node.children.length) {
    for (const child of node.children) {
      if (isParentOfNode(child, nodeId)) {
        return child;
      }

      const match = findParentNode(child, nodeId);

      if (match !== null) {
        return match; // Return the matched node instead of the current node
      }

    }
  }

  if (node.type === 'root_folder') {
    return node
  }

  return null
}

function flattenTree(node: FileTreeNode, entities: Entity[], currentDepth = 0): any {
  return node.children.flatMap((node) => {
    if (node.type === 'folder') {
      return [
        { ...node, depth: currentDepth },
        ...(node.meta.expanded && node.children.length ? flattenTree(node, entities, currentDepth + 1) : [])
      ];
    } else {
      const entity = entities.find((e) => e.id === node.meta.entityId)
      if (!entity) return []
      return [{ ...node, depth: currentDepth, entity }];
    }
  });
}

export const FileExplorer = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined)
  const root = useRootService()

  const { data: fileTreeState } = useTakeFirstDbQuery({
    query: (db) => db.selectFrom('app_state')
      .where('type', '=', 'file_tree')
      .selectAll()
  })

  const rootNode = useMemo(() => {
    return fileTreeState?.data || DEFAULT_ROOT
  }, [fileTreeState])

  const entityIds = useMemo(() => {
    return pickEntityIds(rootNode)
  }, [rootNode])

  const { data: entities, isSuccess } = useDbQuery({
    keys: [entityIds],
    query: (db) => db.selectFrom('entity')
      .where('id', 'in', entityIds)
      .selectAll(),
    enabled: entityIds.length > 0,
  })

  const fileTreeList = useMemo(() => {
    return flattenTree(rootNode, entities)
  }, [rootNode, entities])

  const onAddFile = useCallback(async (nodeId: string | undefined, type: string) => {

    const cloned: FileTreeNode = _.cloneDeep(rootNode)

    let entity

    if (type === 'document') {
      entity = await entityService.insertDocument()
    } else if (type === 'table') {
      entity = await entityService.insertTable()
    }

    const file = {
      id: nanoid(10),
      type: 'file',
      meta: {
        entityId: entity.id
      }
    }

    if (nodeId) {
      const node = findNode(cloned, nodeId)
      if (node) {
        node.meta.expanded = true
        node.children.push(file)      
      }
    } else {
      cloned.children.push(file)
    }
    setSelectedNodeId(file.id)

    const tab = root.windowService.getOrCreateCurrentTab();
    tab.addEntityPage(file.meta.entityId)

    if (rootNode.children.length === 0) {
      fileTreeService.insert(cloned)
    } else {
      fileTreeService.update(cloned)
    }
  }, [rootNode])

  const onAddFolder = useCallback(async (nodeId: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)

    const folder = {
      id: nanoid(10),
      type: 'folder',
      name: 'Example',
      meta: {
        expanded: true,
      },
      children: []
    }

    if (nodeId) {
      const node = findNode(cloned, nodeId)
      if (node) {
        node.meta.expanded = true
        node.children.push(folder)
      }
    } else {
      cloned.children.push(folder)
    }
    setSelectedNodeId(folder.id)

    if (rootNode.children.length === 0) {
      fileTreeService.insert(cloned)
    } else {
      fileTreeService.update(cloned)
    }
  }, [rootNode])

  const onDeleteNode = useCallback(async (nodeId: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)
    
    const parent = findParentNode(cloned, nodeId)
    const node = findNode(cloned, nodeId)

    if (parent && node) {
      if (node.type === 'file') {
        parent.children = parent.children.filter((node) => node.id !== nodeId)
        entityService.deleteById(node.meta.entityId)
      } else if (node.type === 'folder') {
        const entityIdsToDelete = pickEntityIds(node)
        parent.children = parent.children.filter((node) => node.id !== nodeId)
        entityService.deleteByIds(entityIdsToDelete)
      }
    }

    fileTreeService.update(cloned)
  }, [rootNode])

  const onClickItem = useCallback(async (nodeId: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)

    if (nodeId) {
      const node = findNode(cloned, nodeId)
      if (node && node.type === 'folder') {
        node.meta.expanded = !node.meta.expanded
      } else if (node && node.type === 'file') {
        const tab = root.windowService.getOrCreateCurrentTab();
        tab.addEntityPage(node.meta.entityId)
      }
      setSelectedNodeId(nodeId)
    }

    fileTreeService.update(cloned)
  }, [rootNode])

  const onRenameNode = useCallback(async (nodeId: string, title: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)
      const node = findNode(cloned, nodeId)
      if (node) {
        if (node.type === 'folder') {
          node.name = title
          fileTreeService.update(cloned)
        } else if (node.type === 'file') {
          entityService.updateTitle(node.meta.entityId, title)
        }
      }
    
  }, [rootNode])

  if (!isSuccess) {
    return null
  }

  return (
    <FolderTreeList
      selectedNodeId={selectedNodeId}
      list={fileTreeList} 
      onAddFile={onAddFile} 
      onAddFolder={onAddFolder}
      onClickItem={onClickItem}
      onRenameNode={onRenameNode}
      onDeleteNode={onDeleteNode}
    />
  )
}