---
name: mycelium-architecture
description: >-
  Build or refresh a reviewable architecture.md overview from a detailed Mycelium class map,
  and update AGENTS.md to use the overview first and consult the map selectively.
---

# Mycelium architecture guidance

Produce two separate documents in the target repository:

- `architecture.md`: an agent-authored architecture overview for human review, at most 500 lines.
- `docs/assets/mycelium_class_diagram.md`: the detailed generated map, consulted selectively.

All output paths are relative to the target repository root. The overview has no column-width
limit; preserve valid Mermaid syntax rather than wrapping statements to fit a column limit.
The 500-line limit includes headings, prose, blank lines, and diagram blocks. It is a size
constraint, not a token-budget guarantee.

## Workflow

1. Inspect existing architecture guidance and documents before writing. Preserve unrelated
   instructions and reviewed explanations. Check case variants such as `ARCHITECTURE.md` too;
   do not create filenames differing only by case. If an existing document serves another purpose,
   such as a historical proposal, ask before replacing it or choosing another overview path.

2. Use the installed `mycelium-mermaid` skill to analyse the repository and generate the detailed
   map at `docs/assets/mycelium_class_diagram.md`. Request `--detail full` rather than its compact
   default so the backup retains signatures and individual relationship labels. For older releases
   without a detail option, verify that their default is full output before omitting the flag.
   Follow the companion skill's validation and same-map repeat-export checks.

   If the companion skill is missing, perform a supply-chain audit before installing it:

   ```bash
   npx skills add ScottRBK/mycelium --skill mycelium-mermaid -y
   ```

   Verify nonempty `classDiagram` blocks and expected source areas before proceeding. Report
   filtering, extraction, and resolution limitations; full detail does not mean complete analysis.
   Do not replace an existing overview or add new pointers after a failed or empty export.

3. Read the map selectively to build an understanding of the architecture. Inspect its source
   index in chunks, then search relevant diagram identifiers and read bounded line ranges for
   connections. Cover the major source areas, not just the first diagram or the current task.
   Verify important connections against source, especially entry points, wiring, contracts, and
   alternative implementations. Do not load the whole map into context by default.

4. Write or refresh `architecture.md` as a reviewable interpretation of that evidence. Include:

   - A compact Mermaid diagram of major components and their relationships. Choose the diagram
     type that explains the architecture; it need not be another class diagram.
   - Short descriptions of responsibilities, boundaries, and the main execution paths.
   - Important contracts, implementation variants, and where components are wired together.
   - Source paths and line numbers for key inspection points, plus relevant test locations.
   - A link to the detailed map, its exporter version and scope, and material uncertainties.
   - The selective-reading advisories below.

   Use existing repository guidance to explain intended boundaries. Distinguish source-verified
   relationships from inferred groupings and heuristic call edges. Do not invent responsibilities,
   claim exhaustive coverage, or treat an absent edge as proof that no dependency exists.
   Leave complete member inventories, full signatures, and exhaustive edge lists in the map.
   Summarise repeated details to stay within 500 lines; do not silently remove important boundaries
   or implementation variants. Preserve reviewed content that remains accurate on refresh.

5. Put these advisories in the overview, adjusting the map link if its path was explicitly changed:

   ```markdown
   ## Using the detailed map

   The [Mycelium map](docs/assets/mycelium_class_diagram.md) is supporting detail, not required
   reading in full. Do not load the entire file into context by default.

   - Find the relevant declaration in the source index, reading that index in chunks if needed.
   - Search its diagram identifier for connections and read the relevant line ranges.
   - Expand to callers, contracts, alternative implementations, and tests as the task requires.
   - Check relevant warnings and filtering notices. Missing edges do not establish independence.
   - Verify important relationships against source; static call edges can be uncertain.

   This overview is selective and does not replace source inspection. The map may exclude tests;
   inspect test sources or request a test-inclusive export when needed.
   ```

6. After verifying both documents, add or update the root `AGENTS.md` architecture note:

   ```markdown
   ## Architecture

   Before changing code or reasoning about this repository's architecture, read
   [the architecture overview](architecture.md).

   Consult the [detailed Mycelium map](docs/assets/mycelium_class_diagram.md) selectively using
   the overview's reading advisories. Do not load the entire map into context by default.

   After code changes, regenerate the detailed map and check whether the overview needs updating.
   Preserve reviewed explanations that remain accurate rather than rewriting the overview each time.
   Keep the overview at most 500 lines; it has no column-width limit, including Mermaid statements.

   Use the [Mycelium architecture skill][skill] from
   [ScottRBK/mycelium](https://github.com/ScottRBK/mycelium) for this workflow.

   [skill]: https://github.com/ScottRBK/mycelium/tree/master/skills/mycelium-architecture
   ```

   Reuse an existing architecture section. Replace an older instruction to read the whole class
   diagram with overview-first guidance; do not append a contradictory second note. Preserve
   unrelated instructions. Rerunning this skill should update the same documents and note.

7. Verify the overview is nonempty, contains a diagram, and has no more than 500 lines. Check local
   Markdown links and source locations, and inspect Mermaid syntax; report whether it was rendered
   or only checked as text. Verify both AGENTS.md links resolve. Present the overview or its diff
   for review, with material warnings and inferred relationships called out. Report all three paths.
   Do not imply the agent-authored overview is approved merely because generation succeeded.
