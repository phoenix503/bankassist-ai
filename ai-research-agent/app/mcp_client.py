
import os
import asyncio
from urllib.parse import urlencode

from dotenv import load_dotenv
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

load_dotenv()


async def connect_tavily():

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        raise ValueError("TAVILY_API_KEY is missing")

    # Authenticate with Tavily
    query_params = urlencode({
        "tavilyApiKey": api_key
    })

    url = f"https://mcp.tavily.com/mcp/?{query_params}"

    # Establish MCP transport
    async with streamable_http_client(url) as (
        read_stream,
        write_stream
    ):

        # Create MCP session using the streams
        async with ClientSession(
            read_stream,
            write_stream
        ) as session:

            await session.initialize()

            print("Connected to Tavily MCP!")

            # Discover available tools
            result = await session.list_tools()

            print("\nAvailable tools:")

            for tool in result.tools:
                print(f"- {tool.name}")
                print(f"Description: {tool.description}")
                print(f"Schema: {tool.input_schema}")
                print("-" * 50)

            # Execute search
            print("\nExecuting Tavily search...\n")

            search_result = await session.call_tool(
                "tavily_search",
                arguments={
                    "query": "Latest developments in Agentic AI"
                }
            )

            print("Search results:\n")

            for item in search_result.content:

                if hasattr(item, "text"):
                    print(item.text)

            if search_result.is_error:
              print("Tavily reported a tool execution error.")


if __name__ == "__main__":
    asyncio.run(connect_tavily())
