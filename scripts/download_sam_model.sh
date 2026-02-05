#!/usr/bin/env bash
set -euo pipefail

MODEL_ID="Xenova/slimsam-77-uniform"
TARGET_DIR="public/models/${MODEL_ID}"
WASM_DIR="public/wasm"
HF_ENDPOINT="${HF_ENDPOINT:-https://huggingface.co}"

mkdir -p "${TARGET_DIR}/onnx"
mkdir -p "${WASM_DIR}"

base="${HF_ENDPOINT}/${MODEL_ID}/resolve/main"

curl -L "${base}/config.json?download=1" -o "${TARGET_DIR}/config.json"
curl -L "${base}/preprocessor_config.json?download=1" -o "${TARGET_DIR}/preprocessor_config.json"
curl -L "${base}/quantize_config.json?download=1" -o "${TARGET_DIR}/quantize_config.json"

# Quantized ONNX weights (used by this project)
curl -L "${base}/onnx/vision_encoder_quantized.onnx?download=1" -o "${TARGET_DIR}/onnx/vision_encoder_quantized.onnx"
curl -L "${base}/onnx/prompt_encoder_mask_decoder_quantized.onnx?download=1" -o "${TARGET_DIR}/onnx/prompt_encoder_mask_decoder_quantized.onnx"

# ONNX Runtime WASM binaries (same version as transformers.js)
tf_base="https://unpkg.com/@xenova/transformers@2.14.0/dist"
curl -L "${tf_base}/ort-wasm.wasm" -o "${WASM_DIR}/ort-wasm.wasm"
curl -L "${tf_base}/ort-wasm-simd.wasm" -o "${WASM_DIR}/ort-wasm-simd.wasm"
curl -L "${tf_base}/ort-wasm-threaded.wasm" -o "${WASM_DIR}/ort-wasm-threaded.wasm"
curl -L "${tf_base}/ort-wasm-simd-threaded.wasm" -o "${WASM_DIR}/ort-wasm-simd-threaded.wasm"
