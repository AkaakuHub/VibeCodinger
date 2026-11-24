import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientError from "effect/http/HttpClientError";

export function isOfficialRelay(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "");
  return host === "relay.t3.codes" || host.endsWith(".relay.t3.codes");
}

export function isOfficialRelayUrl(value: string): boolean {
  return URL.canParse(value) && isOfficialRelay(new URL(value).hostname);
}

export const layerWithoutOfficialRelay = Layer.effect(
  HttpClient.HttpClient,
  Effect.map(HttpClient.HttpClient, (client) =>
    HttpClient.mapRequestEffect(client, (request) =>
      isOfficialRelayUrl(request.url)
        ? Effect.fail(
            new HttpClientError.HttpClientError({
              reason: new HttpClientError.TransportError({
                request,
                description: "The official T3 relay is disabled.",
              }),
            }),
          )
        : Effect.succeed(request),
    ),
  ),
).pipe(
  Layer.provide(
    FetchHttpClient.layer.pipe(
      Layer.provide(Layer.succeed(HttpClient.TracerPropagationEnabled, false)),
    ),
  ),
);
