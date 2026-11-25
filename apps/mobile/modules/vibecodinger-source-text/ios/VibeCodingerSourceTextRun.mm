#import "VibeCodingerSourceTextRun.h"
#import <React/RCTFabricComponentsPlugins.h>
#import "VibeCodingerSourceTextRunComponentDescriptor.h"
#import <react/renderer/components/VibeCodingerSourceTextSpec/Props.h>
#import <react/renderer/components/VibeCodingerSourceTextSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface VibeCodingerSourceTextRun () <RCTVibeCodingerSourceTextRunViewProtocol>

@end

@implementation VibeCodingerSourceTextRun {
  NSString *_text;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<
      VibeCodingerSourceTextRunComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps =
        std::make_shared<const VibeCodingerSourceTextRunProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<VibeCodingerSourceTextRunProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<VibeCodingerSourceTextRunProps const>(props);

  if (newViewProps.text != oldViewProps.text) {
    NSString *text = [NSString stringWithUTF8String:newViewProps.text.c_str()];
    _text = text;
  }

  [super updateProps:props oldProps:oldProps];
}

+ (BOOL)shouldBeRecycled {
  return NO;
}

Class<RCTComponentViewProtocol> VibeCodingerSourceTextRunCls(void) {
  return VibeCodingerSourceTextRun.class;
}

@end
