# PHOTO-AI-006: opt-in real integration

## Current status, 2026-09-07

The active adapter uses only response_format type json_object. No schema is sent,
and no retry or fallback is implemented. The compact extraction is strictly
validated locally before the deterministic v2 mapper and final validation.
The retained schema is inactive. json_schema failures motivated the change;
the comparisons below do not establish that schema complexity caused them.

Two explicitly authorized calls used the synthetic fixture and identical compact
prompt, model, image, temperature and token budget:

| Format | Result | Runner duration |
| --- | --- | --- |
| json_object | AI_CALL_FAILED; aiStatus=null; aiCode=null; no response | 21605 ms |
| no response_format, isolation only | AI_CALL_FAILED; aiStatus=null; aiCode=null; no response | 11803 ms |

The safe classifier detected neither a JSON Mode rejection nor an explicit quota
or transport indicator. Absence of these indicators does not exclude those causes.
The failure is not specific to json_schema/json_object. Exact remote cause remains
unknown. No additional calls or retries were made. No real output was available
for functional quality assessment; no deploy, commit, push or tag was performed.
The no-format runner mode is diagnostic only, not an adapter fallback.

Local validation: 42 Worker/DO tests; 67 combined tests; 20 browser tests;
syntax valid for 9 entry scripts. Backtest uses one Playwright test containing
multiple individual scenarios. The provider and integration files are also
checked independently with node --check.

The integration runner invokes the core with Wrangler `getPlatformProxy`, a remote
Workers AI binding and only `tests/manual/photo-ai/rotina-diaria-teste.png`.
It does not deploy an endpoint, use Firebase credentials, persist images or
responses, or provide a public authentication bypass. The fixture is not tracked.
Each explicit invocation consumes one real inference; there are no automatic retries.
Use an already installed Wrangler entry as the first argument. No global install
or additional project dependency is needed.

```text
node server/photo-ai-cloudflare/integration/real-ai.mjs <installed-wrangler-entry> baseline
```

`baseline` invokes the current core. `control`, `moderate`, `json`, `schema`, and
`schema6144` are diagnostic comparisons only; they do not change deployed settings.
`original` reconstructs the old context-only user turn from the repository HEAD;
it is only suitable while that historical source remains at HEAD.

## Observations, 2026-09-06

The earlier AI_EMPTY_RESPONSE classification conflated a missing textual response
with a non-null object returned in `response`. An original user turn containing
only context JSON produced an object with the context keys instead of document v2.
The explicit extraction turn removes that context-only instruction. This is not
yet evidence of successful document extraction.

Four directed real calls in the latest continuation:

| Variant | Safe observation | Core result | Total runner duration |
| --- | --- | --- | --- |
| Current core, 3072 tokens | response string, 11648 characters, completion_tokens=3072, no context keys | AI_OUTPUT_TRUNCATED | 114753 ms |
| Full schema in JSON Mode, schema removed from prompt | response string, 2241 characters, completion_tokens=839 | AI_JSON_PARSE_FAILED | 37284 ms |
| Same schema variant, syntax classification | response string, 7671 characters, completion_tokens=3072; unterminated JSON string at offset 7671 | AI_OUTPUT_TRUNCATED | 105963 ms |
| Same schema variant, 6144-token budget | response object with schemaVersion/fields/warnings/document; document is a string; completion_tokens=519 | CONTRACT_V2_FAILED | 29686 ms |

Durations include the development connection setup, not just model inference.
No output text, image bytes, tokens, UID, or prompts are recorded here.
The full schema experiment is supported by Cloudflare's JSON Mode documentation,
but these observed responses did not satisfy the requested schema. It has not
been adopted by the production adapter, and the output budget remains 3072.

Status: **NOT VALIDATED**. No ANALYZE_OK has been observed with the corrected
core and the supplied fixture. Functional accuracy is unconfirmed. Staging was
not redeployed because the user's success condition was not met. Do not recommend
commit, enable the frontend, or claim PHOTO-AI-006 is closed on this evidence.
Further changes need a specific new hypothesis; do not repeat a parameter sweep
or relax the contract to make this fixture pass.

References:
- https://developers.cloudflare.com/workers/wrangler/api/
- https://developers.cloudflare.com/workers-ai/features/json-mode/
- https://developers.cloudflare.com/workers-ai/guides/tutorials/llama-vision-tutorial/
