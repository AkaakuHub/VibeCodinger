import { makeSecretProviderDefinitionRegistry } from "@vibecodinger/secret-provider-core/shared/definition";
import * as OnePassword from "@vibecodinger/secret-provider-onepassword/shared/definition";

export const builtInSecretProviderDefinitions = makeSecretProviderDefinitionRegistry([
  OnePassword.definition,
]);
