
// Namespace
var RedmineWikiTabPreview = RedmineWikiTabPreview || {};

/* ***********************************************
 CONFIG BEGIN
 ************************************************/

/**
 * @class Text
 * @desc Text labels
 */

RedmineWikiTabPreview.Text = RedmineWikiTabPreview.Text || {
  NO_PREVIEW: 'Nothing to preview',
  PREVIEW_DIVS: {
    description: 'Description',
    notes: 'Notes',
    preview: 'Preview',
    text: 'Preview',
    write: 'Write'
  }
};

/**
 * @class Elements
 * @desc Renders Elements
 * @methods draw()
 */
RedmineWikiTabPreview.Elements = (function(Text) {
  var $textArea;
  var $editor;
  var $buttonsHtml = '<div class="jstEditor-preview-header"><ul>' +
    '<li class="active"><a href="#" data-type="write">'  + Text.PREVIEW_DIVS.write + '</a></li>' +
    '<li><a href="#" data-type="preview">'  + Text.PREVIEW_DIVS.preview + '</a></li></ul></div>' +
    '</ul></div>';

  var init = function(editor) {
    $editor = editor;
    $textArea = $editor.find('textarea');
    return this;
  };

  var draw = function() {
    $editor.addClass('write');
    $editor.prepend($buttonsHtml)
      .append(drawWikiPreview());
    return this;
  };

  var drawWikiPreview = function() {
    // issue[notes] regex
    var regex = /\[([^\]]+)\]/;
    var name = $textArea.prop('name');
    var type = (name.match(regex)) ? name.match(/\[([^\]]+)\]/)[1] : name;
    return $('<div />', {
      'id': 'wiki-preview-' + type,
      'class': 'wiki-preview wiki',
      'data-type': type
    });
  };

  return {
    init: init,
    draw: draw
  };
})(RedmineWikiTabPreview.Text);

/**
 * @class View
 * @desc Updates preview html
 * @methods draw()
 */
RedmineWikiTabPreview.View = (function(Text) {
  var $preview;

  var init = function(preview, original_preview) {
    $preview = preview;
    $original_preview = original_preview;
    return this;
  };

  var update = function() {
    var html = original_preview_html();
    if (html.length === 0) {
      html = Text.NO_PREVIEW;
    }
    $preview.html(html);
    return this;
  };

  var original_preview_html = function(){
    return $original_preview
      .find('.preview')
      .html()
      .replace(/<legend>[^>]*>/g, '').trim();
  };

  return {
    init: init,
    update: update
  };
})(RedmineWikiTabPreview.Text);

/**
 * @class Ajax
 * @desc Runs ajax request to update preview
 * @methods draw()
 */
RedmineWikiTabPreview.Ajax = (function(View) {
  var $preview;

  var init = function(preview) {
    $preview = preview;
    return this;
  };

  var send = function() {
    eval(onclick());
    return this;
  };

  // private

  var onclick = function() {
    return $preview.closest('form').find('a[accesskey=r]').attr('onclick')
      .replace(/return false;/, '');
  };

  // Overide main submitPreview method
  var submitPreview = function(url, form, target) {
    $.ajax({
      url: url,
      type: 'post',
      data: submitPreviewData(),
      success: submitPreviewSuccess
    });
  };

  var submitPreviewData = function() {
    var ENSURE_PREVIEW = ' ';
    var params = [$.param(attachments())];
    params.push($.param(textarea()) + ENSURE_PREVIEW);
    return params.join('&');
  };

  var submitPreviewSuccess = function(data) {
    var preview = $('<div />').html(data);
    View.init($preview, preview).update();
  };

  var textarea = function(){
    return $preview.closest('.jstEditor').find('textarea');
  };

  var attachments = function(){
    return $("input[name^='attachments']");
  };

  return {
    init: init,
    send: send
  };
})(RedmineWikiTabPreview.View);

/**
 * @class Tab
 * @desc Handles tab behavior
 */
RedmineWikiTabPreview.Tab = (function(Ajax) {
  var $tab;
  var type;

  var init = function(tab) {
    $tab = tab;
    type = tab.data('type');
    return this;
  };

  var activate = function() {
    activateTab();
    activateView();
    submitAjax();
  };

  // private

  var activateTab = function() {
    $tab.parent('li').addClass('active').siblings().removeClass('active');
  };

  var activateView = function() {
    $tab.closest('.jstEditor').removeClass('write preview').addClass(type);
  };

  var submitAjax = function() {
    if (type === 'preview') {
      var $preview = $tab.closest('.jstEditor').find('.wiki-preview');
      Ajax.init($preview).send();
    }
  };

  return {
    init: init,
    activate: activate
  };
})(RedmineWikiTabPreview.Ajax);

/**
 * @class TabEvents
 * @desc Binds Tab Events
 */
RedmineWikiTabPreview.TabEvents = (function(Tab) {
  var $editor;

  var init = function(editor) {
    $editor = editor;
    initEvents();
    return this;
  };

  // private

  var initEvents = function() {
    $editor.on('click', '.jstEditor-preview-header a', function(e) {
      e.preventDefault();
      Tab.init($(this)).activate();
    });
  };

  return {
    init: init
  };
})(RedmineWikiTabPreview.Tab);

/**
 * @class EditorEvents
 * @desc When editor is focused, attach the preview to the editor
 */
RedmineWikiTabPreview.EditorEvents = (function(Elements, TabEvents) {
  var init = function() {
    bindExistingEditors();
    bindNewEditors();
  };

  // private

  var bindExistingEditors = function() {
    $('.jstEditor:not(.write,.preview)').each(initPreview);
  };

  var bindNewEditors = function() {
    $('#content').on('focus', '.jstEditor:not(.write,.preview)', initPreview);
  };

  var initPreview = function() {
    var $this = $(this);
    Elements.init($this).draw();
    TabEvents.init($this);
  };

  return {
    init: init
  };
})(RedmineWikiTabPreview.Elements, RedmineWikiTabPreview.TabEvents);

/**
 * @class EditorAutoFocus
 * @desc Auto focus on editors when edit button is clicked
 */
RedmineWikiTabPreview.EditorAutoFocus = (function() {
  var init = function() {
    $('.wiki.editable, #all_attributes').each(focus);
  };

  // private

  var focus = function() {
    var $this = $(this);
    var $editLink = $this.find('a.icon-edit, a:has(img[alt=Edit])');
    if (focusIssueDescription($this, $editLink)) {
      return false;
    }
    focusGeneral($this, $editLink);
  };

  var focusIssueDescription = function($this, $editLink) {
    if ($this.attr('id') === 'all_attributes') {
      $editLink.on('click', function() {
        $('#issue_description_and_toolbar textarea').focus();
      });
      return true;
    }
    return false;
  };

  var focusGeneral = function($this, $editLink) {
    var onclickSuccess = successFunction.toString()
      .replace(/%s/, '#' + formId($this));
    var onclick = $editLink.attr('onclick')
      .replace(/}/, ', success: ' + onclickSuccess + '}');
    $editLink.attr('onclick', onclick);
  };

  var successFunction = function() {
    $('%s').find('textarea').focus();
  };

  var formId = function($this) {
    if ($this.attr('id') === 'all_attributes') {
      return 'issue_description';
    }
    return $this.attr('id').replace(/notes/, 'form');
  };

  return {
    init: init
  };
})();

/**
 * @class EnsureAjaxCsrf
 * @desc Ensure that CSRF token is include with Ajax calls
 */
RedmineWikiTabPreview.EnsureAjaxCsrf = (function() {
  var init = function() {
    $.ajaxPrefilter(ensureAjaxCsrfPrefilter);
  };

  // private

  var ensureAjaxCsrfPrefilter = function(options, originalOptions, jqXHR) {
    if (!options.crossDomain) {
      return setRequestHeader(jqXHR);
    }
  };

  var setRequestHeader = function(jqXHR) {
    var token = $('meta[name="csrf-token"]').attr('content');
    if (token) {
      return jqXHR.setRequestHeader('X-CSRF-Token', token);
    }
  };

  return {
    init: init
  };
})();

/**
 * @class Style
 * @desc Build and write stylesheet with CSS to the page
 * @methods add()
 * @methods write()
 */
RedmineWikiTabPreview.Style = (function() {
  var style = document.createElement('style');
  style.type = 'text/css';

  return {
    add: function(css) {
      style.innerHTML += css;
      return this;
    },

    write: function() {
      var head = document.getElementsByTagName('head')[0];
      head.appendChild(style);
      return this;
    }
  };
})();

$(function() {

  var $preview_links = $('a[accesskey=r]');
  if($preview_links.length > 0){
    // Set styles
    var redmineBackgroundColor = $('#header').css('background-color');
    RedmineWikiTabPreview.Style
      .add('.jstEditor-preview-header ul li.active a {border-bottom-color: ' + redmineBackgroundColor + ';} ')
      .write();

    RedmineWikiTabPreview.EnsureAjaxCsrf.init();
    RedmineWikiTabPreview.EditorEvents.init();
    RedmineWikiTabPreview.EditorAutoFocus.init();
  }

});
