"""
Demo script: Streaming response from NVIDIA AI endpoints using ChatNVIDIA.

Prerequisites:
    pip install langchain-nvidia-ai-endpoints

Set your NVIDIA API key as an environment variable:
    set NVIDIA_API_KEY=nvapi-xxxxx        (Windows CMD)
    $env:NVIDIA_API_KEY = "nvapi-xxxxx"   (PowerShell)
    export NVIDIA_API_KEY=nvapi-xxxxx     (Linux/macOS)

You can get a free API key from https://build.nvidia.com/
"""

import sys
import time

from langchain_nvidia_ai_endpoints import ChatNVIDIA

# Non-deprecated models to try in order (smaller/faster first to avoid timeouts)
FALLBACK_MODELS = [
    "meta/llama-3.1-8b-instruct",
    "google/gemma-3-4b-it",
    "mistralai/mistral-7b-instruct-v0.3",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "meta/llama-3.3-70b-instruct",
]

MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 5


def try_stream(llm: ChatNVIDIA, message: str) -> bool:
    """Attempt to stream a response. Returns True on success, False on failure."""
    try:
        for chunk in llm.stream(message):
            print(chunk.content, end="", flush=True)
        print()  # final newline
        return True
    except Exception as e:
        print(f"\n\nError: {e}\n")
        return False


def main() -> None:
    # --- Configuration ---
    api_key = "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"

    # Use env override or try fallback models
    env_model = None  # "deepseek-ai/deepseek-v4-flash"
    models_to_try = [env_model] if env_model else FALLBACK_MODELS

    # --- Prompt (keep it short to reduce timeout risk) ---
    user_message = "What is LangChain in 3 sentences?"

    print(f"Prompt: {user_message}")
    print("=" * 60)

    for model in models_to_try:
        print(f"\nTrying model: {model}")
        print("-" * 60)

        llm = ChatNVIDIA(
            model=model,
            nvidia_api_key=api_key,
            temperature=0.7,
            max_tokens=256,  # keep small to avoid timeouts
            timeout=60,  # fail faster instead of waiting 5 min
        )

        for attempt in range(1, MAX_RETRIES + 1):
            print(f"  Attempt {attempt}/{MAX_RETRIES}...")
            success = try_stream(llm, user_message)
            if success:
                print("-" * 60)
                print("Done.")
                return
            if attempt < MAX_RETRIES:
                print(f"  Retrying in {RETRY_DELAY_SECONDS}s...")
                time.sleep(RETRY_DELAY_SECONDS)

        print(
            f"  Model '{model}' failed after {MAX_RETRIES} attempts. Trying next...\n"
        )

    print("\nAll models failed. Possible causes:")
    print("  - NVIDIA API may be experiencing downtime")
    print("  - Your API key may not have access to these models")
    print("  - Network connectivity issues")
    print("\nCheck status at: https://build.nvidia.com/")
    sys.exit(1)


if __name__ == "__main__":
    main()
