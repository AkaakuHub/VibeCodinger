package expo.modules.vibecodingercomposereditor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import org.json.JSONObject
import org.json.JSONArray

internal object VibeCodingerComposerClipboard {
  // Pasted thread links become chips in JS; packages/shared/src/threadLinks.ts parses them.
  fun hasThreadLink(text: String): Boolean =
    text.contains("vc-thread://v2/") || text.contains("vibecodinger://threads/")

  // Clipboard bridges can echo our text back without its HTML context metadata.
  private var copiedContext: Pair<String, String>? = null

  @Synchronized
  fun write(context: Context, text: String, fragment: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val payload = try {
      JSONObject(fragment)
    } catch (_: Exception) {
      null
    }
    val records = payload?.optJSONArray("records")
    if (payload == null || records == null) {
      copiedContext = null
      clipboard.setPrimaryClip(ClipData.newPlainText("VibeCodinger", text))
      return
    }
    val all = (0 until records.length()).map { records.getJSONObject(it) }
    val selected = all.filter { text.contains("/${it.optString("contextId")})") }.toMutableList()
    val screenshots = selected.map { it.optString("screenshotContextId") }.toSet()
    selected.addAll(
      all.filter {
        screenshots.contains(it.optString("contextId")) &&
          !selected.contains(it)
      }
    )
    payload.put("records", JSONArray(selected))
    val serialized = payload.toString()
    val encoded = java.net.URLEncoder.encode(serialized, "UTF-8").replace("+", "%20")
    val escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    copiedContext = if (selected.isEmpty()) null else text to serialized
    clipboard.setPrimaryClip(
      if (selected.isEmpty()) {
        ClipData.newPlainText(
          "VibeCodinger",
          text
        )
      } else {
        ClipData.newHtmlText(
          "VibeCodinger",
          text,
          "<pre data-vibecodinger-context-fragment=\"$encoded\">$escaped</pre>"
        )
      }
    )
  }

  @Synchronized
  fun read(context: Context): Map<String, String> {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = clipboard.primaryClip
    val item = if (clip != null && clip.itemCount > 0) clip.getItemAt(0) else null
    val text = item?.text?.toString() ?: ""
    val html = item?.htmlText ?: ""
    val copied = copiedContext?.takeIf {
      clip?.itemCount == 1 && item?.uri == null && it.first == text
    }
    if (copied == null) copiedContext = null
    return mapOf(
      "text" to text,
      "html" to html,
      "fragment" to
        if (!html.contains("data-t3-context-fragment=")) copied?.second.orEmpty() else ""
    )
  }
}

class VibeCodingerComposerEditorModule : Module() {
  @Suppress("LongMethod") // A flat list of the view's props and events.
  override fun definition() = ModuleDefinition {
    Name("VibeCodingerComposerEditor")

    AsyncFunction("writeContextClipboard") { text: String, fragment: String ->
      VibeCodingerComposerClipboard.write(requireNotNull(appContext.reactContext), text, fragment)
    }

    View(VibeCodingerComposerEditorView::class) {
      Prop("controlledDocumentJson") { view: VibeCodingerComposerEditorView, documentJson: String ->
        view.setControlledDocumentJson(documentJson)
      }
      Prop("themeJson") { view: VibeCodingerComposerEditorView, themeJson: String ->
        view.setThemeJson(themeJson)
      }
      Prop("clipboardFragment") { view: VibeCodingerComposerEditorView, fragment: String ->
        view.setClipboardFragment(fragment)
      }
      Prop("placeholder") { view: VibeCodingerComposerEditorView, placeholder: String ->
        view.setPlaceholder(placeholder)
      }
      Prop("fontFamily") { view: VibeCodingerComposerEditorView, fontFamily: String ->
        view.setFontFamily(fontFamily)
      }
      Prop("fontSize") { view: VibeCodingerComposerEditorView, fontSize: Double ->
        view.setFontSize(fontSize.toFloat())
      }
      Prop("lineHeight") { view: VibeCodingerComposerEditorView, lineHeight: Double ->
        view.setLineHeight(lineHeight.toFloat())
      }
      Prop("contentInsetVertical") {
          view: VibeCodingerComposerEditorView,
          contentInsetVertical: Double
        ->
        view.setContentInsetVertical(contentInsetVertical.toInt())
      }

      Prop("singleLineCentered") {
          view: VibeCodingerComposerEditorView,
          singleLineCentered: Boolean
        ->
        view.setSingleLineCentered(singleLineCentered)
      }
      Prop("editable") { view: VibeCodingerComposerEditorView, editable: Boolean ->
        view.setEditable(editable)
      }
      Prop("readOnly") { view: VibeCodingerComposerEditorView, readOnly: Boolean ->
        view.setReadOnly(readOnly)
      }
      Prop("enterBehavior") { view: VibeCodingerComposerEditorView, behavior: String ->
        view.setEnterBehavior(behavior)
      }
      Prop("submitEnabled") { view: VibeCodingerComposerEditorView, enabled: Boolean ->
        view.setSubmitEnabled(enabled)
      }
      Prop("scrollEnabled") { view: VibeCodingerComposerEditorView, scrollEnabled: Boolean ->
        view.setScrollEnabled(scrollEnabled)
      }
      Prop("autoFocus") { view: VibeCodingerComposerEditorView, autoFocus: Boolean ->
        view.setAutoFocus(autoFocus)
      }
      Prop("autoCorrect") { view: VibeCodingerComposerEditorView, autoCorrect: Boolean ->
        view.setAutoCorrect(autoCorrect)
      }
      Prop("spellCheck") { view: VibeCodingerComposerEditorView, spellCheck: Boolean ->
        view.setSpellCheck(spellCheck)
      }
      Prop("textPasteThresholdBytes") { view: VibeCodingerComposerEditorView, threshold: Int ->
        view.setTextPasteThresholdBytes(threshold)
      }
      Prop("maxInputChars") { view: VibeCodingerComposerEditorView, maxInputChars: Int ->
        view.setMaxInputChars(maxInputChars)
      }

      Events(
        "onComposerChange",
        "onComposerSelectionChange",
        "onComposerFocus",
        "onComposerBlur",
        "onComposerSubmit",
        "onComposerPasteImages",
        "onComposerContextPress",
        "onComposerPasteContext",
        "onComposerPasteText",
        "onComposerContentSizeChange",
      )

      AsyncFunction("focus") { view: VibeCodingerComposerEditorView ->
        view.focusEditor()
      }
      AsyncFunction("blur") { view: VibeCodingerComposerEditorView ->
        view.blurEditor()
      }
      AsyncFunction("setSelection") { view: VibeCodingerComposerEditorView, start: Int, end: Int ->
        view.setSelection(start, end)
      }
    }
  }
}
