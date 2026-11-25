#pragma once

#include "VibeCodingerSourceTextShadowNode.h"

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {
using VibeCodingerSourceTextComponentDescriptor =
    ConcreteComponentDescriptor<VibeCodingerSourceTextShadowNode>;

void VibeCodingerSourceTextSpec_registerComponentDescriptorsFromCodegen(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
} // namespace facebook::react
