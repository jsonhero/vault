import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from 'nanoid'
import _ from 'lodash'
import { useDatabase } from "~/context";
import { useQuery } from "~/context/database-context";

import { DataSchema, Entity } from "~/types/db-types";
import { FolderTreeList } from './file-tree-list'
import { useAppStateService } from "../app-state";

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
  const db = useDatabase()
  const appState = useAppStateService()
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined)

  const fileTreeState = useQuery<any>("SELECT * FROM app_state WHERE type = 'file_tree'", [], {
    takeFirst: true,
    jsonFields: ['data']
  }).data

  const rootNode = useMemo(() => {
    return fileTreeState?.data || DEFAULT_ROOT
  }, [fileTreeState])

  const entityIds = useMemo(() => {
    return pickEntityIds(rootNode)
  }, [rootNode])

  const entities = useQuery<Entity[]>(`SELECT * FROM entity WHERE id IN (${entityIds.join(', ')})`, []).data

  const fileTreeList = useMemo(() => {
    return flattenTree(rootNode, entities)
  }, [rootNode, entities])

  const onAddFile = useCallback(async (nodeId: string | undefined, type: string) => {

    const cloned: FileTreeNode = _.cloneDeep(rootNode)

    let entity

    if (type === 'document') {
      entity = await db.execute<Entity>(`INSERT INTO entity (title, type) VALUES ('Placeholder', ?) RETURNING *`, [type], {
        takeFirst: true,
      })
      await db.execute(`INSERT INTO document (entity_id) VALUES (?) RETURNING *`, [entity.id])
    } else if (type === 'table') {
      const defaultSchema = {
        columns: [
          {
            id: nanoid(),
            type: 'title',
            name: 'Name'
          }
        ]
      }
      const dataSchema = await db.execute<DataSchema>(`INSERT INTO data_schema (schema) VALUES (?) RETURNING *`, [JSON.stringify(defaultSchema)], {
        takeFirst: true,
      });
      entity = await db.execute<Entity>(`INSERT INTO entity (title, type, data_schema_id) VALUES ('Placeholder', 'table', ?) RETURNING *`, [dataSchema.id], {
        takeFirst: true,
      })
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
    appState.setSelectedEntityId(file.meta.entityId)


    if (rootNode.children.length === 0) {
      await db.execute("INSERT INTO app_state (type, data) VALUES (?, ?)", ['file_tree', JSON.stringify(cloned)])
    } else {
      await db.execute("UPDATE app_state SET data = ? WHERE type = 'file_tree'", [JSON.stringify(cloned)])
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
      await db.execute("INSERT INTO app_state (type, data) VALUES (?, ?)", ['file_tree', JSON.stringify(cloned)])
    } else {
      await db.execute("UPDATE app_state SET data = ? WHERE type = 'file_tree'", [JSON.stringify(cloned)])
    }
  }, [rootNode])

  const onDeleteNode = useCallback(async (nodeId: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)
    
    const parent = findParentNode(cloned, nodeId)
    const node = findNode(cloned, nodeId)

    // await db.execute("DELETE FROM app_state WHERE type = 'file_tree'")

    if (parent && node) {
      if (node.type === 'file') {
        parent.children = parent.children.filter((node) => node.id !== nodeId)
        await db.execute("DELETE FROM entity WHERE id = ?", [node.meta.entityId])
      } else if (node.type === 'folder') {
        const entityIdsToDelete = pickEntityIds(node)
        console.log(entityIdsToDelete, 'delete')
        parent.children = parent.children.filter((node) => node.id !== nodeId)
        await db.execute(`DELETE FROM entity WHERE id IN (${entityIdsToDelete.join(', ')})`)
      }
    }
    
    await db.execute("UPDATE app_state SET data = ? WHERE type = 'file_tree'", [JSON.stringify(cloned)])

  }, [rootNode])

  const onClickItem = useCallback(async (nodeId: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)

    if (nodeId) {
      const node = findNode(cloned, nodeId)
      if (node && node.type === 'folder') {
        node.meta.expanded = !node.meta.expanded
      } else if (node && node.type === 'file') {
        appState.setSelectedEntityId(node.meta.entityId)
      }
      setSelectedNodeId(nodeId)
    }

    await db.execute("UPDATE app_state SET data = ? WHERE type = 'file_tree'", [JSON.stringify(cloned)])

  }, [rootNode])

  const onRenameNode = useCallback(async (nodeId: string, title: string) => {
    const cloned: FileTreeNode = _.cloneDeep(rootNode)
      const node = findNode(cloned, nodeId)
      if (node) {
        if (node.type === 'folder') {
          node.name = title
          await db.execute("UPDATE app_state SET data = ? WHERE type = 'file_tree'", [JSON.stringify(cloned)])
        } else if (node.type === 'file') {
          await db.execute("UPDATE entity SET title = ? WHERE id = ?", [title, node.meta.entityId])
        }
      }
    
  }, [rootNode])

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