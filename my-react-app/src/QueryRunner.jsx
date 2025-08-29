import { useState } from "react";
import { useSqliteDb } from "./hooks/useSqliteDb";

export function QueryRunner() {
  const db = useSqliteDb();
  const [sql, setSql] = useState("SELECT name FROM sqlite_master WHERE type = 'table';");
  const [rows, setRows] = useState([]);

  function runQuery() {
    if (!db) {
      console.log("Database still loading…");
      return;
    }
    try {
      const result = db.exec(sql);
      const first = result[0];
      setRows(first ? mapRows(first) : []);
    } catch (e) {
      console.error(e.message);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <textarea style={{ width: "100%", padding: "0.5rem" }} rows={4} value={sql} onChange={(e) => setSql(e.target.value)} />
      <button onClick={runQuery} style={{ marginTop: "0.5rem" }}>
        Run
      </button>

      {rows.length > 0 && (
        <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {Object.keys(rows[0]).map((col) => (
                <th key={col} style={{ border: "1px solid #ccc", padding: "4px" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((cell, i) => (
                  <td key={i} style={{ border: "1px solid #ccc", padding: "4px" }}>
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function mapRows(stmt) {
  // stmt.columns -> ["id", "title"]
  // stmt.values  -> [[1, "hello"], [2, "world"]]
  return stmt.values.map((v) => Object.fromEntries(v.map((cell, i) => [stmt.columns[i], cell])));
}
