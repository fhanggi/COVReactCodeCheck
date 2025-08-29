import { useEffect, useState } from "react";
import initSqlJs from "sql.js";
// "?url" tells Vite to give us the final URL of the asset
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

export function useSqliteDb() {
  const [db, setDb] = useState(null);

  useEffect(loadDatabase, []);

  function loadDatabase() {
    let dbInstance;

    async function open() {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl });
      const fileBytes = await fetch("/COVReactCodeCheck.db").then((r) => r.arrayBuffer());
      dbInstance = new SQL.Database(new Uint8Array(fileBytes));
      setDb(dbInstance);
    }

    open();
    return () => dbInstance?.close();
  }

  return db;
}
