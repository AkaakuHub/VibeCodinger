#pragma once

#include <react/renderer/components/VibeCodingerSourceTextSpec/EventEmitters.h>
#include <react/renderer/components/VibeCodingerSourceTextSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

extern const char VibeCodingerSourceTextComponentName[];

class VibeCodingerSourceTextStateReal final {
public:
  AttributedString attributedString;
};

class VibeCodingerSourceTextShadowNode final
    : public ConcreteViewShadowNode<VibeCodingerSourceTextComponentName,
                                    VibeCodingerSourceTextProps, VibeCodingerSourceTextEventEmitter,
                                    VibeCodingerSourceTextStateReal> {
public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  VibeCodingerSourceTextShadowNode(const ShadowNode &sourceShadowNode,
                         const ShadowNodeFragment &fragment);

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  void layout(LayoutContext layoutContext) override;

  Size
  measureContent(const LayoutContext &layoutContext,
                 const LayoutConstraints &layoutConstraints) const override;

private:
  mutable AttributedString _attributedString;
};
} // namespace facebook::react
