# encoding: utf-8
require_dependency 'redmine_editor_preview_tab'
require_dependency 'redmine_editor_preview_tab/previews_controller_patch'

Redmine::Plugin.register :redmine_editor_preview_tab do
  name 'Redmine Editor Preview Tab Extension'
  author 'Thomas Leishman'
  description 'The Redmine Editor Preview Tab Extension adds a preview tab to the Redmine text editor, similar to the editor on Github.'
  version '0.1.2'
  url 'https://github.com/tleish/redmine_editor_preview_tab'
  author_url 'https://github.com/tleish'
  settings :default => { hide_default_preview: false, enabled: true } , :partial => 'redmine_editor_preview_tab/settings'
end
