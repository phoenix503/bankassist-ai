from app.llm import ask_llm

if __name__ == "__main__":

    answer = ask_llm(
        "Explain how an AI agent uses MCP tools."
    )

    print(answer)