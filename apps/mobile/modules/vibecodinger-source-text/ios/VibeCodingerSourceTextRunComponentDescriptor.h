#pragma once

#include "VibeCodingerSourceTextRunShadowNode.h"

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {
using VibeCodingerSourceTextRunComponentDescriptor =
    ConcreteComponentDescriptor<VibeCodingerSourceTextRunShadowNode>;

void VibeCodingerSourceTextRunSpec_registerComponentDescriptorsFromCodegen(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);
} // namespace facebook::react
