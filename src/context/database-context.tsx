import { createContext, ReactNode, useCallback, useContext } from 'react'
import { CtxAsync, useDB } from "@vlcn.io/react";
import { useQuery as useVulcanQuery } from '@vlcn.io/react';


type Execute = <T = any>(query: string, bindings?: any[], options?: ExecuteOptions) => T

const databaseContext = createContext<{
  ctx: CtxAsync,
  execute: Execute,
}>(null)



export interface ExecuteOptions {
  takeFirst?: boolean;
  jsonFields?: string[]
}

function convertRowJson<T>(row: T, fields: string[] = []) {
  for (const field of fields) {  
    // @ts-ignore
    const jsonStr = row[field] as string
    if (typeof jsonStr === 'string') {
      // @ts-ignore
      row[field] = JSON.parse(jsonStr)

    }
  }

  return row
}

export function modifyRows(rows: any[], options?: ExecuteOptions) {
  if (options?.takeFirst) {
    if (rows.length > 0) {
      if (options?.jsonFields) {
        return convertRowJson(rows[0], options.jsonFields)
      }
      return rows[0]
    }
  }

  if (rows.length && options?.jsonFields) {
    return rows.map((r) => convertRowJson(r, options.jsonFields))
  }
  return rows
}


export const DatabaseProvider: React.FC<{
  children: ReactNode;
  dbName: string;
}> = ({ children, dbName }) => {
  const ctx = useDB(dbName);

  const execute = useCallback<Execute>(
    // @ts-ignore
    async (query, bindings = [], options) => {
      const rows = await ctx.db.execO(query, bindings);
      if (rows) {
        return modifyRows(rows, options)
      }
    },
    [ctx]
  );

  return (
    <databaseContext.Provider value={{
      ctx,
      execute,
    }}>{children}</databaseContext.Provider>
  );
};

export const useDatabase = () => useContext(databaseContext)

export const useQuery = <T, R = T>(query: string, bindings?: any[], options?: ExecuteOptions) => {
  const { ctx } = useDatabase()

  return useVulcanQuery<T, R>(ctx, query, bindings, (rows) => modifyRows(rows, options))
}
