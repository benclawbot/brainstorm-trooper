# Local ChatGPT OAuth runtime

`siwc-local-0.1.0.tgz` contains the official OpenAI `@siwc/local` runtime from
[sign-in-with-chatgpt-devkit](https://github.com/openai/sign-in-with-chatgpt-devkit),
commit `f723814abdccec135b519c451fb6e1992ee5e933`.

The SDK is distributed as a local workspace rather than a registry package.
Its license and third-party notices are included in the archive.

Brainstorm Trooper adds `responseOptions` to `StreamResponseOptions` and returns
the final `response.completed.response` alongside text. These two additions let
the app retain structured outputs, low reasoning effort, and web-search citations.
The SDK still controls `store: false`, `stream: true`, OAuth, identity validation,
encrypted storage, refresh, and completion checks. No credentials are bundled.
