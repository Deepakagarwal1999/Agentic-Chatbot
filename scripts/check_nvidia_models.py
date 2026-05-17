"""
Script to test all non-deprecated ChatNVIDIA models and save the working ones.

Sends a short prompt to each model with a timeout. Models that respond
successfully are saved to 'working_models.json'.

Prerequisites:
    pip install langchain-nvidia-ai-endpoints

Set NVIDIA_API_KEY before running.
"""

import json
import os
import time
from datetime import datetime

from langchain_nvidia_ai_endpoints import ChatNVIDIA

# All non-deprecated chat models from the CHAT_MODEL_TABLE
NON_DEPRECATED_MODELS = [
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "google/codegemma-7b",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "mistralai/mixtral-8x22b-v0.1",
    "upstage/solar-10.7b-instruct",
    "mistralai/mistral-7b-instruct-v0.3",
    "01-ai/yi-large",
    "mistralai/codestral-22b-instruct-v0.1",
    "google/gemma-3-12b-it",
    "google/gemma-3-27b-it",
    "google/gemma-3-4b-it",
    "mistralai/mathstral-7b-v0.1",
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-guard-4-12b",
    "google/gemma-2-2b-it",
    "mistralai/mistral-nemotron",
    "nvidia/nemotron-mini-4b-instruct",
    "nvidia/llama-3.1-nemoguard-8b-content-safety",
    "nvidia/llama-3.1-nemoguard-8b-topic-control",
    "nvidia/usdcode-llama-3.1-70b-instruct",
    "meta/llama-3.3-70b-instruct",
    "qwen/qwen2.5-coder-32b-instruct",
    "meta/llama-3.2-1b-instruct",
    "meta/llama-3.2-3b-instruct",
    "zyphra/zamba2-7b-instruct",
    "abacusai/dracarys-llama-3.1-70b-instruct",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "nvidia/llama-3.3-nemotron-super-49b-v1",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "moonshotai/kimi-k2-instruct",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "nvidia/nvidia-nemotron-nano-9b-v2",
    "bytedance/seed-oss-36b-instruct",
    "moonshotai/kimi-k2-instruct-0905",
    "qwen/qwen3-next-80b-a3b-instruct",
    "qwen/qwen3-next-80b-a3b-thinking",
    "deepseek-ai/deepseek-v3.1-terminus",
    "moonshotai/kimi-k2-thinking",
    "nvidia/nemotron-3-nano-30b-a3b",
    "deepseek-ai/deepseek-v3.2",
    "stepfun-ai/step-3.5-flash",
    "nvidia/nemotron-3-super-120b-a12b",
    "minimaxai/minimax-m2.5",
    "google/gemma-4-31b-it",
    "minimaxai/minimax-m2.7",
    "z-ai/glm-5.1",
    "deepseek-ai/deepseek-v4-pro",
    "deepseek-ai/deepseek-v4-flash",
    "microsoft/phi-4-mini-instruct",
]

TIMEOUT_SECONDS = 30
TEST_PROMPT = "Say hello in one sentence."
OUTPUT_FILE = "scripts/working_models.json"


def test_model(model_id: str, api_key: str) -> dict:
    """Test a single model. Returns a result dict."""
    print(f"  Testing: {model_id} ... ", end="", flush=True)
    start = time.time()

    try:
        llm = ChatNVIDIA(
            model=model_id,
            nvidia_api_key=api_key,
            temperature=0.1,
            max_tokens=50,
            # timeout=TIMEOUT_SECONDS,
        )

        response_text = ""
        for chunk in llm.stream(TEST_PROMPT):
            response_text += chunk.content

        elapsed = round(time.time() - start, 2)
        print(f"OK ({elapsed}s)")
        return {
            "model": model_id,
            "status": "working",
            "response_preview": response_text[:100],
            "latency_seconds": elapsed,
        }

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        error_msg = str(e)[:150]
        print(f"FAILED ({elapsed}s) - {error_msg}")
        return {
            "model": model_id,
            "status": "failed",
            "error": error_msg,
            "latency_seconds": elapsed,
        }


def main() -> None:
    api_key = "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"

    print(f"Testing {len(NON_DEPRECATED_MODELS)} non-deprecated models...")
    print(f"Timeout per model: {TIMEOUT_SECONDS}s")
    print(f'Prompt: "{TEST_PROMPT}"')
    print("=" * 70)

    working = []
    failed = []

    for i, model_id in enumerate(NON_DEPRECATED_MODELS, 1):
        print(f"\n[{i}/{len(NON_DEPRECATED_MODELS)}]")
        result = test_model(model_id, api_key)

        if result["status"] == "working":
            working.append(result)
        else:
            failed.append(result)

        # Small delay between requests to avoid rate limiting
        time.sleep(1)

    # --- Summary ---
    print("\n" + "=" * 70)
    print(
        f"RESULTS: {len(working)} working / {len(failed)} failed / {len(NON_DEPRECATED_MODELS)} total"
    )
    print("=" * 70)

    if working:
        print("\nWorking models:")
        for m in working:
            print(f"  ✓ {m['model']} ({m['latency_seconds']}s)")

    if failed:
        print(f"\nFailed models: {len(failed)}")
        for m in failed:
            print(f"  ✗ {m['model']}")

    # --- Save results ---
    output = {
        "tested_at": datetime.now().isoformat(),
        "total_models": len(NON_DEPRECATED_MODELS),
        "working_count": len(working),
        "failed_count": len(failed),
        "working_models": working,
        "failed_models": failed,
    }

    output_path = os.path.join(os.path.dirname(__file__), "working_models.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
