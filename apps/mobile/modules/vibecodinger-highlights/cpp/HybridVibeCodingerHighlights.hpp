#pragma once

#include "HybridVibeCodingerHighlightsSpec.hpp"

namespace margelo::nitro::vibecodingerhighlights {

class HybridVibeCodingerHighlights : public HybridVibeCodingerHighlightsSpec {
public:
  HybridVibeCodingerHighlights() : HybridObject(TAG) {}

  std::optional<std::shared_ptr<ArrayBuffer>> tokenize(SourceText source,
                                                       double language) override;
};

} // namespace margelo::nitro::vibecodingerhighlights
