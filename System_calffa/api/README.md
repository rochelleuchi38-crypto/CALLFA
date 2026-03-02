# CALFFA ML API (Python)

This is the model-serving API that provides /predict and /health endpoints.

Configuration
- Default port is 5001 (set by PORT=5001) to avoid colliding with the Node backend which uses 5000.
- Model and crop mapping paths can be configured via environment variables:
  - `ML_MODEL_PATH` (default: `model/crop_profit_model.pkl`)
  - `ML_CROP_MAPPING_PATH` (default: `model/crop_mapping.pkl`)

Quick start (PowerShell):

```powershell
cd api
# run on port 5001 (default), ensure model files exist or a fallback model will be used
$env:PORT = '5001'
python main.py
```

If the model files are missing the server uses a deterministic fallback model for tests and development.
