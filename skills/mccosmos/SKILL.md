---
name: mccosmos
description: Use when exploring McDonald's nutrition snapshots with McCosmos, finding comparable foods, explaining nutrition relationships, or planning shortest nutrition-similarity routes through the project's deterministic CLI.
---

# McCosmos · 麦门星图

Run the CLI from the checked-out project root with Node.js 24+ and dependencies installed. Obtain CLI evidence before describing a food or relationship.

```sh
pnpm cosmos:cli -- list --category=burger
pnpm cosmos:cli -- neighbors --name="巨无霸" --limit=3
pnpm cosmos:cli -- route --from="巨无霸" --to="双层吉士汉堡"
pnpm cosmos:cli -- discover --kind=twins
pnpm cosmos:cli -- discover --kind=lonely
```

- CLI reads the official snapshot, not a live store menu. It does not need a Token to analyze existing data. Refresh separately with `pnpm sync:mcd`, requiring `MCD_MCP_TOKEN` and official `list-nutrition-foods` access.
- Results are JSON: `ok`, `mode`, `source`, `fetchedAt`, `warnings`, and `data/error`. Nonzero exit means failure. Inspect the JSON; do not invent success.
- `AMBIGUOUS` returns candidate IDs. Ask the user to choose, then use `--id`, `--from-id`, or `--to-id`; never silently choose the first candidate. Resolve returned neighbor/route IDs using `list` before presenting names.
- Demo requires explicit `--demo` and must be described as synthetic. Missing official data never authorizes automatic demo fallback.
- Report date, mode, source and unit/basis limitations. If `unitsVerified=false`, say “原始值，单位待核实”; never invent per-serving/per-100g quantities. `null` means unavailable, not zero.
- Category is locally inferred. Similarity is an engineering estimate, not an official health rating. Explain with returned common dimensions and differences. A BFS route is not a recommendation to eat those foods; `NO_ROUTE` is a valid outcome.
- Never echo, log or publish the Token. This Skill does not access addresses, accounts, coupons, orders, payments or points, and gives no medical advice.

For algorithm details, read `MCP_INTEGRATION.md` in the project root. Install by copying this folder to a Skill directory supported by the target client; project dependencies and working directory remain separate requirements.
