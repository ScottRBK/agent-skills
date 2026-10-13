# Running without uv

Install or upgrade the package in an activated Python 3.12+ virtual environment:

```bash
python -m pip install --upgrade --only-binary=mycelium-map mycelium-map
mycelium-map export --help
```

Replace the workflow's uvx prefix with `mycelium-map`. Prebuilt wheels include the Rust engine;
if no wheel matches, report the Python/platform limitation instead of starting a source build.
