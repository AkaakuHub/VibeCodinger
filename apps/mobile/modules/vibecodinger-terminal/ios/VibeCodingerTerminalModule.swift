import ExpoModulesCore

public class VibeCodingerTerminalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VibeCodingerTerminalSurface")

    // Bumped when native hardware-keyboard handling changes; surfaced in the JS debug
    // logs so a stale native binary is distinguishable from a broken key pipeline.
    Constants([
      "hardwareKeyRevision": 4,
      "outputRevision": 1,
    ])

    View(VibeCodingerTerminalView.self) {
      AsyncFunction("writeOutput") { (view: VibeCodingerTerminalView, data: String, reset: Bool) in
        view.writeOutput(data, reset: reset)
      }

      AsyncFunction("resetInput") { (view: VibeCodingerTerminalView) in
        view.resetInputField()
      }

      Prop("terminalKey") { (view: VibeCodingerTerminalView, terminalKey: String) in
        view.terminalKey = terminalKey
      }

      Prop("initialBuffer") { (view: VibeCodingerTerminalView, initialBuffer: String) in
        view.initialBuffer = initialBuffer
      }

      Prop("fontSize") { (view: VibeCodingerTerminalView, fontSize: Double) in
        view.fontSize = CGFloat(fontSize)
      }

      Prop("focusRequest") { (view: VibeCodingerTerminalView, focusRequest: Double) in
        view.focusRequest = focusRequest
      }

      Prop("readOnly") { (view: VibeCodingerTerminalView, readOnly: Bool) in
        view.readOnly = readOnly
      }

      Prop("autoFocus") { (view: VibeCodingerTerminalView, autoFocus: Bool) in
        view.autoFocus = autoFocus
      }

      Prop("appearanceScheme") { (view: VibeCodingerTerminalView, appearanceScheme: String) in
        view.appearanceScheme = appearanceScheme
      }

      Prop("themeConfig") { (view: VibeCodingerTerminalView, themeConfig: String) in
        view.themeConfig = themeConfig
      }

      Prop("backgroundColor") { (view: VibeCodingerTerminalView, backgroundColor: String) in
        view.backgroundColorHex = backgroundColor
      }

      Prop("foregroundColor") { (view: VibeCodingerTerminalView, foregroundColor: String) in
        view.foregroundColorHex = foregroundColor
      }

      Prop("mutedForegroundColor") { (view: VibeCodingerTerminalView, mutedForegroundColor: String) in
        view.mutedForegroundColorHex = mutedForegroundColor
      }

      Prop("captureRequest") { (view: VibeCodingerTerminalView, request: Double) in
        view.captureRequest = request
      }

      Prop("sharedGrid") { (view: VibeCodingerTerminalView, sharedGrid: [Int]) in
        view.sharedGrid = sharedGrid
      }
      Events("onInput", "onResize", "onCapture", "onPaste")

      OnViewDidUpdateProps { (view: VibeCodingerTerminalView) in
        view.applyPendingBuffer()
      }
    }
  }
}
