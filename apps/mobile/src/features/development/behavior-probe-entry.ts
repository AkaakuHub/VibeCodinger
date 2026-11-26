<<<<<<< 540352f163c19136cb2703e6edfd0857a6d5c886
// Metro folds this condition before collecting dependencies, excluding the probe from release bundles.
if (__DEV__ && process.env.EXPO_PUBLIC_VC_BEHAVIOR_PROBE === "1") {
=======
// Production bundles inline the unset flag, so Metro folds this away before collecting dependencies.
// Only mobile:behavior's and mobile:metrics' Metro sets it, including mobile:metrics' release bundle.
if (process.env.EXPO_PUBLIC_T3_BEHAVIOR_PROBE === "1") {
  // A production bundle sets up no DevTools hook; React still reports commits to one it finds.
  const global = globalThis as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: object };
  if (!__DEV__)
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ ??= {
      isDisabled: false,
      supportsFiber: true,
      renderers: new Map(),
      inject: () => 1,
      onScheduleFiberRoot: () => {},
      onCommitFiberRoot: () => {},
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {},
      checkDCE: () => {},
    };
>>>>>>> 22d45b4fa870caa1844be46c7bf217bb07517432
  require("./behavior-probe");
}
