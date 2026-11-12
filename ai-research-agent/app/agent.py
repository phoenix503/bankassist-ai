
import os
import json
import asyncio
from urllib.parse import urlencode

from dotenv import load_dotenv
from groq import Groq
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

load_dotenv()

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


async def run_agent(question: str):

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        raise ValueError("TAVILY_API_KEY is missing")

    query_params = urlencode({
        "tavilyApiKey": api_key
    })

    url = f"https://mcp.tavily.com/mcp/?{query_params}"

    async with streamable_http_client(url) as (
        read_stream,
        write_stream,
    ):
        async with ClientSession(
            read_stream,
            write_stream
        ) as session:

            await session.initialize()

            print("Agent connected to Tavily MCP")

            # 1. Discover MCP tools
            mcp_tools = await session.list_tools()

            search_tool = next(
                tool for tool in mcp_tools.tools
                if tool.name == "tavily_search"
            )

            # 2. Convert MCP schema into Groq tool format
            groq_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": search_tool.name,
                        "description": search_tool.description or "",
                        "parameters": search_tool.input_schema
                    }
                }
            ]

            messages = [
                {
                    "role": "system",
                    "content": """
                    You are an AI research assistant.

                    Use tavily_search when current or external
                    information is needed.

                    Analyze the search results before answering.
                    Include relevant source URLs in your answer.
                    Do not invent sources or facts.
                    """
                },
                {
                    "role": "user",
                    "content": question
                }
            ]

            # 3. Agent execution loop
            max_iterations = 3

            for iteration in range(max_iterations):

                print(f"\nAgent iteration: {iteration + 1}")

                response = groq_client.chat.completions.create(
                    model=os.getenv("GROQ_MODEL"),
                    messages=messages,
                    tools=groq_tools,
                    tool_choice="auto"
                )

                assistant_message = response.choices[0].message

                # 4. Check whether the LLM requested a tool
                if not assistant_message.tool_calls:
                    return assistant_message.content

                messages.append(
                    assistant_message.model_dump(exclude_none=True)
                )

                # 5. Execute requested MCP tools
                for tool_call in assistant_message.tool_calls:

                    tool_name = tool_call.function.name

                    arguments = json.loads(
                        tool_call.function.arguments
                    )

                    print(f"Executing MCP tool: {tool_name}")
                    print(f"Arguments: {arguments}")

                    tool_result = await session.call_tool(
                        tool_name,
                        arguments=arguments
                    )

                    if tool_result.is_error:
                        result_text = "Tool execution failed."
                    else:
                        result_text = "\n".join(
                            item.text
                            for item in tool_result.content
                            if hasattr(item, "text")
                        )

                    # 6. Send tool observation back to LLM
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": result_text
                    })

            # 7. Ask LLM to provide a final answer
            messages.append({
                "role": "user",
                "content": (
                    "Provide your best final answer using the "
                    "research gathered so far. Include source URLs."
                )
            })

            final_response = groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL"),
                messages=messages
            )

            return final_response.choices[0].message.content


if __name__ == "__main__":

    research_question = (
        "Research the latest developments in Agentic AI. "
        "Explain important trends and practical applications."
    )

    answer = asyncio.run(
        run_agent(research_question)
    )

    print("\n========== FINAL RESEARCH REPORT ==========\n")
    print(answer)
