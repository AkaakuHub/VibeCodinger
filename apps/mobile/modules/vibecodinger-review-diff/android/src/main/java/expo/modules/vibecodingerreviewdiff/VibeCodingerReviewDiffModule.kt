package expo.modules.vibecodingerreviewdiff

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder

private val REVIEW_DIFF_EVENTS = arrayOf(
  "onDebug",
  "onVisibleFileChange",
  "onToggleFile",
  "onToggleViewedFile",
  "onPressLine",
  "onToggleComment",
  "onPressNotice",
)

class VibeCodingerReviewDiffModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VibeCodingerReviewDiffSurface")

    View(VibeCodingerReviewDiffView::class) {
      Prop("tokensResetKey") { view: VibeCodingerReviewDiffView, tokensResetKey: String ->
        view.setTokensResetKey(tokensResetKey)
      }
      Prop("contentResetKey") { view: VibeCodingerReviewDiffView, contentResetKey: String ->
        view.setContentResetKey(contentResetKey)
      }
      Prop("collapsedFileIdsJson") {
          view: VibeCodingerReviewDiffView,
          collapsedFileIdsJson: String
        ->
        view.setCollapsedFileIdsJson(collapsedFileIdsJson)
      }
      Prop("viewedFileIdsJson") { view: VibeCodingerReviewDiffView, viewedFileIdsJson: String ->
        view.setViewedFileIdsJson(viewedFileIdsJson)
      }
      Prop("selectedRowIdsJson") { view: VibeCodingerReviewDiffView, selectedRowIdsJson: String ->
        view.setSelectedRowIdsJson(selectedRowIdsJson)
      }
      Prop("collapsedCommentIdsJson") {
          view: VibeCodingerReviewDiffView,
          collapsedCommentIdsJson: String
        ->
        view.setCollapsedCommentIdsJson(collapsedCommentIdsJson)
      }
      Prop("appearanceScheme") { view: VibeCodingerReviewDiffView, appearanceScheme: String ->
        view.setAppearanceScheme(appearanceScheme)
      }
      Prop("themeJson") { view: VibeCodingerReviewDiffView, themeJson: String ->
        view.setThemeJson(themeJson)
      }
      Prop("styleJson") { view: VibeCodingerReviewDiffView, styleJson: String ->
        view.setStyleJson(styleJson)
      }
      Prop("rowHeight") { view: VibeCodingerReviewDiffView, rowHeight: Double ->
        view.setRowHeight(rowHeight.toFloat())
      }
      // Accept the shared prop while deriving Android's scroll range from the drawn text.
      Prop("contentWidth") { _: VibeCodingerReviewDiffView, _: Double -> }
      Prop("contentInsetBottom") { view: VibeCodingerReviewDiffView, value: Double ->
        view.setContentInsetBottom(value.toFloat())
      }
      Prop("scrollEnabled") { view: VibeCodingerReviewDiffView, enabled: Boolean ->
        view.setScrollEnabled(enabled)
      }
      Prop("initialRowIndex") { view: VibeCodingerReviewDiffView, initialRowIndex: Double ->
        view.setInitialRowIndex(initialRowIndex)
      }
      Prop("initialFileId") { view: VibeCodingerReviewDiffView, fileId: String ->
        view.setInitialFileId(fileId)
      }

      Events(REVIEW_DIFF_EVENTS)

      AsyncFunction("scrollToFile") {
          view: VibeCodingerReviewDiffView,
          fileId: String,
          animated: Boolean
        ->
        view.scrollToFile(fileId, animated)
      }
      AsyncFunction("scrollToTop") { view: VibeCodingerReviewDiffView, animated: Boolean ->
        view.scrollToTop(animated)
      }
      registerContentFunctions()

      OnViewDestroys { view: VibeCodingerReviewDiffView ->
        view.cleanup()
      }
    }
  }
}

private fun ViewDefinitionBuilder<VibeCodingerReviewDiffView>.registerContentFunctions() {
  AsyncFunction("setRowsJson") {
      view: VibeCodingerReviewDiffView,
      rowsJson: String,
      resetKey: String
    ->
    view.setContentResetKey(resetKey)
    view.setRowsJson(rowsJson)
  }
  AsyncFunction("setTokensJson") { view: VibeCodingerReviewDiffView, tokensJson: String ->
    view.setTokensJson(tokensJson)
  }
  AsyncFunction("setTokensPatchJson") {
      view: VibeCodingerReviewDiffView,
      tokensPatchJson: String,
      promise: Promise
    ->
    view.setTokensPatchJson(tokensPatchJson) { accepted -> promise.resolve(accepted) }
  }
}
