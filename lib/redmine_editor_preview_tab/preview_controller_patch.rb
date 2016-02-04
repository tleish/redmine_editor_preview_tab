# Patch to always show issue preview
require 'previews_controller'

module PreviewsControllerPatch
  def issue
    params[:issue][:description] << ' ' if description? && editor_preview_tab?
    super
  end

  private

  def editor_preview_tab?
    params[:editor_preview_tab].present?
  end

  def description?
    params.fetch(:issue, {})[:description].present?
  end
end

PreviewsController.prepend(PreviewsControllerPatch)