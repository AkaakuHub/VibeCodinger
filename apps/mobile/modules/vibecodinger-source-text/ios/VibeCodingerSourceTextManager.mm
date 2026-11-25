#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface VibeCodingerSourceTextManager : RCTViewManager
@end

@implementation VibeCodingerSourceTextManager

RCT_EXPORT_MODULE(VibeCodingerSourceText)

- (UIView *)view {
  return [[UIView alloc] init];
}

@end

@interface VibeCodingerSourceTextRunManager : RCTViewManager
@end

@implementation VibeCodingerSourceTextRunManager

RCT_EXPORT_MODULE(VibeCodingerSourceTextRun)

- (UIView *)view {
  return nil;
}

@end
