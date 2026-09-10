# PHOTO-AI-006 — direct REST isolation, 2026-09-07

The approved single request bypassed Firebase, Durable Objects, the PMP HTTP
handler, getPlatformProxy and env.AI.run. Authentication came from Wrangler
whoami --json and auth token --json, with subprocess output captured privately.
The script does not write tokens, images, prompts or model output.

## Timeouts audited before the request

- Deployed configuration in source: PHOTO_AI_TIMEOUT_MS=40000.
- Worker withTimeout wraps the core promise and abort notification; the signal
  is not forwarded to the AI binding.
- Core adapter: no setTimeout, Promise.race or AbortController.
- Previous getPlatformProxy integration: no application deadline; dispose runs
  after settlement, not before.
- Earlier runner durations of 21605 ms and 11803 ms include setup and do not
  correspond to the absent core/integration timer or the 40000 ms Worker timer.
- Direct REST diagnostic: explicit 180000 ms ceiling. It did not expire.

## Fixture comparison

| Property | Documentary fixture | Vision health |
| --- | --- | --- |
| PNG bytes | 1865610 | 776 |
| Dimensions | 1086 x 1448 | 256 x 256 |
| Base64 characters | 2487480 | measured from embedded fixture |
| Data URL characters | 2487502 | embedded data URL |
| Prompt | current compact prompt, 1923 characters | minimal textual response |
| max_tokens | 3072 | 8 |
| temperature | 0.1 | 0.1 |

The unchanged documentary request was 2489582 UTF-8 bytes and did not include
response_format. Neither size nor prompt length is proven causal.

## One real REST observation

- HTTP: 400
- success: false
- errors[].code: [3030]
- error message: withheld by the allowlisted sanitizer
- result: empty object
- result keys: []
- response: absent; type undefined; length null
- REST duration: 3385 ms

The failure reproduces outside the PMP Worker/binding/timeout. Code 3030 alone
does not identify a unique cause. The first sanitizer withheld unrecognized
message text, so this observation cannot distinguish an input rejection from
another upstream model error.

## Message-structure isolation

A subsequent identical REST diagnostic retained and safely classified the
Cloudflare message as model validation: the service reported that it could not
add the image because it found no system- or user-supplied message. Local
pre-fetch inspection proved the original body was a JSON string with one
non-empty user message and a valid image data URL, without a wrapper.

One allowed control then used Cloudflare's documented message structure with
the same image: a system instruction followed by a separate user request,
without JSON Mode and with max_tokens 8. It returned HTTP 200, success true,
and a non-empty textual response in 2056 ms. This establishes that the REST
endpoint, model, account and fixture work.

The active adapter now uses the same two-turn system/user structure while
keeping its compact prompt, image, json_object, temperature and output budget.
No further real call was made after this correction. Local regression covers
the two roles and absence of request context.

No change to ProviderExtractionV1, prompt, mapper, JSON Mode, image or budget.
No new binding inference: the conditional test required REST success.
No successful extraction, quality assessment, deploy, commit, push or tag.

## Commands

Use the installed Wrangler entry; do not install a new version for this test.
The measure mode makes no network calls. Each run mode is one explicit inference.

    node server/photo-ai-cloudflare/integration/rest-ai.mjs unused measure
    node server/photo-ai-cloudflare/integration/rest-ai.mjs <wrangler-entry> run

References:

- https://developers.cloudflare.com/workers/wrangler/commands/general/
- https://developers.cloudflare.com/workers-ai/platform/errors/
