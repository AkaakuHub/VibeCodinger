import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";

import {
  VibeCodingerProjectFile,
  VIBECODINGER_PROJECT_FILE_SCHEMA_URL,
} from "@vibecodinger/contracts";

import { fromLenientJson } from "./schemaJson.ts";

export const VibeCodingerProjectFileFromJson = fromLenientJson(VibeCodingerProjectFile);

const decodeVibeCodingerProjectFile = Schema.decodeExit(VibeCodingerProjectFileFromJson);

export function parseVibeCodingerProjectFile(contents: string): VibeCodingerProjectFile | null {
  const decoded = decodeVibeCodingerProjectFile(contents);
  return Exit.isSuccess(decoded) ? decoded.value : null;
}

export function buildVibeCodingerProjectFileJsonSchema(): Record<string, unknown> {
  const document = Schema.toJsonSchemaDocument(VibeCodingerProjectFile, {
    onExcessProperty: "error",
  });
  const jsonSchema: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: VIBECODINGER_PROJECT_FILE_SCHEMA_URL,
    ...document.schema,
  };
  if (document.definitions && Object.keys(document.definitions).length > 0) {
    jsonSchema.$defs = document.definitions;
  }
  return jsonSchema;
}
