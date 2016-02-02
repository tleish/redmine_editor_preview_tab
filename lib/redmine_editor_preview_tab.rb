class RedmineEditorPreviewTabHookListener < Redmine::Hook::ViewListener
  render_on :view_layouts_base_html_head, :partial => "redmine_editor_preview_tab/redmine_editor_preview_tab_partial"
end