# server.py
import sqlite3

from loguru import logger
from mcp.server.fastmcp import FastMCP

# Configure Loguru to log to a file
logger.add("server.log", rotation="1 MB", retention="7 days", compression="zip")

# Create an MCP server
mcp = FastMCP("Demo")


@mcp.tool()
def query_data(sql: str) -> str:
    """Execute SQL queries safely"""
    logger.info(f"Executing SQL query: {sql}")
    # conn = sqlite3.connect("./COVReactCodeCheck.db")
    conn = sqlite3.connect(r"\\covtoolsprd01\SAS\COVReactCodeCheck\COVReactCodeCheck.db")
    
    try:
        result = conn.execute(sql).fetchall()
        conn.commit()
        return "\n".join(str(row) for row in result)
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        conn.close()


@mcp.prompt()
def example_prompt(code: str) -> str:
    return f"Please review this code:\n\n{code}"


if __name__ == "__main__":
    print("Starting server...")
    # Initialize and run the server
    mcp.run(transport="stdio")
