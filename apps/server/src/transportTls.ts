// @effect-diagnostics nodeBuiltinImport:off - Node owns the TLS and HTTP sockets.
import * as NodeHttp from "node:http";
// @effect-diagnostics nodeBuiltinImport:off - Node owns the TLS and HTTP sockets.
import * as NodeTls from "node:tls";
// @effect-diagnostics nodeBuiltinImport:off - Node owns the TLS and HTTP sockets.
import type * as NodeNet from "node:net";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as Schedule from "effect/Schedule";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";

class TransportTlsError extends Schema.TaggedError<TransportTlsError>()("TransportTlsError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Defect()),
}) {}

export const isDirectTlsRequest = (request: { readonly source: object }): boolean =>
  request.source instanceof NodeHttp.IncomingMessage &&
  request.source.socket instanceof NodeTls.TLSSocket;

const portConfig = Config.option(Config.Int("T3CODE_TLS_PORT"));

export const layerRequireTls = Layer.unwrap(
  Effect.gen(function* () {
    if (Option.isNone(yield* portConfig)) return Layer.empty;
    return HttpRouter.middleware(
      (effect) =>
        Effect.flatMap(HttpServerRequest.HttpServerRequest, (request) => {
          if (isDirectTlsRequest(request)) return effect;
          // The headless pairing CLI discovers the local listener before minting its link.
          if (
            request.method === "GET" &&
            request.url === "/.well-known/t3/environment" &&
            /^127\.0\.0\.1(?::\d+)?$/.test(request.headers.host ?? "") &&
            request.headers["x-forwarded-proto"] === undefined
          ) {
            return effect;
          }
          return Effect.succeed(HttpServerResponse.empty({ status: 403 }));
        }),
      { global: true },
    );
  }),
);

const configuration = Config.all({
  port: portConfig,
  cert: Config.option(Config.NonEmptyString("T3CODE_TLS_CERT_FILE")),
  key: Config.option(Config.NonEmptyString("T3CODE_TLS_KEY_FILE")),
});

export const layer = (
  http: NodeHttp.Server,
  options: {
    readonly plainHost: string;
    readonly tailscaleServeEnabled: boolean;
    readonly remoteClientsAllowed: boolean;
  },
) =>
  Layer.effectDiscard(
    Effect.gen(function* () {
      const { port, cert, key } = yield* configuration;
      if (Option.isNone(port) && Option.isNone(cert) && Option.isNone(key)) return;
      if (
        Option.isNone(port) ||
        Option.isNone(cert) ||
        Option.isNone(key) ||
        port.value < 1 ||
        port.value > 65_535
      ) {
        return yield* new TransportTlsError({
          message: "Set T3CODE_TLS_PORT, T3CODE_TLS_CERT_FILE, and T3CODE_TLS_KEY_FILE together.",
        });
      }
      if (!options.remoteClientsAllowed) {
        return yield* new TransportTlsError({
          message: "Managed policy disallows remote clients.",
        });
      }
      if (options.plainHost !== "127.0.0.1" || options.tailscaleServeEnabled) {
        return yield* new TransportTlsError({
          message:
            "Direct TLS requires the plain listener on 127.0.0.1 and a separate raw TCP forwarder.",
        });
      }

      const fs = yield* FileSystem.FileSystem;
      const readCredentials = Effect.all(
        [fs.readFileString(cert.value), fs.readFileString(key.value)],
        { concurrency: 2 },
      );
      let credentials = yield* readCredentials;
      const security = { minVersion: "TLSv1.3" } satisfies NodeTls.SecureContextOptions;
      const sockets = new Set<NodeNet.Socket>();
      const server = yield* Effect.acquireRelease(
        Effect.try({
          try: () => {
            const listener = NodeTls.createServer(
              {
                ...security,
                cert: credentials[0],
                key: credentials[1],
                handshakeTimeout: 10_000,
                ALPNProtocols: ["http/1.1"],
              },
              (socket) => {
                // Node's HTTP server accepts injected connections. Hand the authenticated TLS
                // stream directly to the same HTTP/WebSocket handlers, without a plaintext proxy.
                http.emit("connection", socket);
              },
            );
            listener.on("connection", (socket) => {
              sockets.add(socket);
              socket.once("close", () => sockets.delete(socket));
            });
            return listener;
          },
          catch: (cause) =>
            new TransportTlsError({ message: "Could not configure the TLS listener.", cause }),
        }),
        (listener) =>
          Effect.sync(() => {
            listener.close();
            for (const socket of sockets) socket.destroy();
          }),
      );
      yield* Effect.callback<void, TransportTlsError>((resume) => {
        const onError = (cause: Error) =>
          resume(
            Effect.fail(
              new TransportTlsError({ message: "Could not bind the TLS listener.", cause }),
            ),
          );
        server.once("error", onError);
        server.listen(port.value, "127.0.0.1", () => {
          server.off("error", onError);
          resume(Effect.void);
        });
      });
      const reload = Effect.gen(function* () {
        const [cert, key] = yield* readCredentials;
        if (cert === credentials[0] && key === credentials[1]) return;
        yield* Effect.try({
          try: () => server.setSecureContext({ ...security, cert, key }),
          catch: () =>
            new TransportTlsError({
              message: "The replacement TLS certificate or key is invalid.",
            }),
        });
        credentials = [cert, key];
        yield* Effect.logInfo("TLS certificate reloaded");
      });
      yield* reload.pipe(
        Effect.catch(() => Effect.logWarning("Could not reload TLS certificate")),
        Effect.schedule(Schedule.spaced("5 minutes")),
        Effect.forkScoped,
      );
      yield* Effect.logInfo("TLS listener ready", { port: port.value });
    }),
  );
