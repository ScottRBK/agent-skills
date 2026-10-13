---
name: interlinked
description: Confirm an agreed action plan before execution.
disable-model-invocation: true
---

# Interlinked

Check whether the latest Interlinked action list is still awaiting approval. Only an unapproved list
is pending.

## No list is pending

List the concrete actions agreed during the preceding discussion. Include only agreed actions.
Use plain language. Respond with exactly this structure, without a code fence or extra text:

Interlinked - I will perform the following actions
- <action>
- <action>
Interlinked

If no actions have been agreed, say so instead of inventing a list.

The displayed list is now pending. Do not begin the work in the same response.

## A list is pending

Use this user message to resolve the pending list:

- The whole message must be the exact, case-sensitive word `Interlinked` to approve the list.
  The list is no longer pending. Begin its actions without printing the list again.
- Any other response is a correction. Do not begin the work. Apply the correction and print the
  complete revised list in the same structure. Keep it pending.
