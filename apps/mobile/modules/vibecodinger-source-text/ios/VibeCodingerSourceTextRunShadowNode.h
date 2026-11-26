#pragma once

#include <react/renderer/components/VibeCodingerSourceTextSpec/EventEmitters.h>
#include <react/renderer/components/VibeCodingerSourceTextSpec/Props.h>
#include <react/renderer/components/VibeCodingerSourceTextSpec/States.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {
extern const char VibeCodingerSourceTextRunComponentName[];

using VibeCodingerSourceTextRunShadowNode =
    ConcreteViewShadowNode<VibeCodingerSourceTextRunComponentName, VibeCodingerSourceTextRunProps,
                           VibeCodingerSourceTextRunEventEmitter, VibeCodingerSourceTextRunState>;
} // namespace facebook::react
