---
name: mycelium-mermaid
description: >-
  Generate Mermaid class diagrams from source code or a saved Mycelium map. Use for standalone
  Markdown diagrams or when another skill needs a diagram generated.
---

# Mycelium class diagrams

Use the latest PyPI release through `uvx`; Mycelium supplies the declarations and relationships.
Run commands from the target repository. Bundled reference links resolve beside this `SKILL.md`,
regardless of the working directory. No Mycelium checkout is needed.

If uv is unavailable, read [running without uv](references/running-without-uv.md).
For scope, test selection, or multiple diagram blocks, read
[export options](references/export-options.md).

1. Select the repository and output, defaulting to the current repository and `class-diagram.md`.
   Create the output's parent directory if needed. Analyse the whole repository; keep the large JSON
   in a temporary directory outside it. Substitute the selected output in this POSIX example:

   ```bash
   diagram_tmp=$(mktemp -d)
   uvx --no-build mycelium-map@latest analyze . -o "$diagram_tmp/map.json" --quiet
   uvx --no-build mycelium-map@latest \
     export "$diagram_tmp/map.json" -o class-diagram.md --max-classes 1000
   ```

   For a supplied map, skip analysis and export that snapshot. Missing declaration data requires
   fresh analysis; report a blocker if its source is unavailable.

2. Check for `classDiagram` blocks, expected source areas, and warnings. Aim for one diagram;
   recognised tests stay excluded unless requested. Investigate empty output before changing scope.
   Preserve full names, keys, and relationship lists; change options and regenerate to adjust them.

3. Export the same map with identical options and version to a temporary file; compare bytes.
   Deliver the Markdown link, exporter version, diagram count, and material warnings.
   Calls are static heuristics; distinguish a Markdown check from a rendered preview.
