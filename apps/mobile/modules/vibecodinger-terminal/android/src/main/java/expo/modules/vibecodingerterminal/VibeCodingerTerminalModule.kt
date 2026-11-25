package expo.modules.vibecodingerterminal

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VibeCodingerTerminalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VibeCodingerTerminalSurface")

    // Bumped when native hardware-keyboard handling changes; surfaced in the JS debug
    // logs so a stale native binary is distinguishable from a broken key pipeline.
    Constants(
      "hardwareKeyRevision" to 2,
      "outputRevision" to 1,
    )

    View(VibeCodingerTerminalView::class) {
      AsyncFunction("writeOutput") { view: VibeCodingerTerminalView, data: String, reset: Boolean ->
        view.writeOutput(data, reset)
      }

      // The Android input field already clears after every change.
      AsyncFunction("resetInput") { _: VibeCodingerTerminalView -> }

      Prop("terminalKey") { view: VibeCodingerTerminalView, terminalKey: String ->
        view.terminalKey = terminalKey
      }

      Prop("initialBuffer") { view: VibeCodingerTerminalView, initialBuffer: String ->
        view.initialBuffer = initialBuffer
      }

      Prop("fontSize") { view: VibeCodingerTerminalView, fontSize: Double ->
        view.fontSize = fontSize.toFloat()
      }

      Prop("focusRequest") { view: VibeCodingerTerminalView, focusRequest: Double ->
        view.focusRequest = focusRequest
      }

      Prop("readOnly") { view: VibeCodingerTerminalView, readOnly: Boolean ->
        view.readOnly = readOnly
      }

      Prop("autoFocus") { view: VibeCodingerTerminalView, autoFocus: Boolean ->
        view.autoFocus = autoFocus
      }

      Prop("appearanceScheme") { view: VibeCodingerTerminalView, appearanceScheme: String ->
        view.appearanceScheme = appearanceScheme
      }

      Prop("themeConfig") { view: VibeCodingerTerminalView, themeConfig: String ->
        view.themeConfig = themeConfig
      }

      Prop("backgroundColor") { view: VibeCodingerTerminalView, backgroundColor: String ->
        view.backgroundColorHex = backgroundColor
      }

      Prop("foregroundColor") { view: VibeCodingerTerminalView, foregroundColor: String ->
        view.foregroundColorHex = foregroundColor
      }

      Prop("mutedForegroundColor") { view: VibeCodingerTerminalView, mutedForegroundColor: String ->
        view.mutedForegroundColorHex = mutedForegroundColor
      }

      Prop("captureRequest") { view: VibeCodingerTerminalView, request: Double ->
        view.captureRequest = request
      }

      Prop("sharedGrid") { view: VibeCodingerTerminalView, sharedGrid: List<Int> ->
        view.sharedGrid = sharedGrid
      }
      Events("onInput", "onResize", "onCapture")

      OnViewDidUpdateProps { view: VibeCodingerTerminalView ->
        view.applyPendingBuffer()
      }

      OnViewDestroys { view: VibeCodingerTerminalView ->
        view.cleanup()
      }
    }
  }
}
