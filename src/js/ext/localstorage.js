"use strict";
/* global global: false */
var console = require("console");
var ko = require("knockout");

var lsLoader = function(id, emailProcessorBackend) {
  var mdStr = global.localStorage.getItem("metadata-" + id);
  if (mdStr === null) {
    mdStr = JSON.stringify({
      created: new Date(),
      editorversion: '0.17.5',
      key: id,
      name: 'master-template',
      template: 'templates/master-template/template-master-template.html',
      templateversion: "1.1.19"
    });
    global.localStorage.setItem('metadata-' + id, mdStr);
  }
  var model;
  var td = global.localStorage.getItem("template-" + id);
  if (td !== null) model = JSON.parse(td);
  var md = JSON.parse(mdStr);
  return {
    metadata: md,
    model: model,
    extension: lsCommandPluginFactory(md, emailProcessorBackend)
  };
};

function sendParentMsg(msg) {
  global.window.parent.postMessage({
    html: msg.html,
    json: msg.json,
    source: 'mosaico-save'
  }, '*');
}

var lsCommandPluginFactory = function(md, emailProcessorBackend) {
  var commandsPlugin = function(mdkey, mdname, viewModel) {

    // console.log("loading from metadata", md, model);
    var saveCmd = {
      name: 'Save', // l10n happens in the template
      enabled: ko.observable(true)
    };
    saveCmd.execute = function() {
      sendParentMsg({
        html: viewModel.exportHTML(),
        json: viewModel.exportJSON(),
      });
      saveCmd.enabled(true);
      viewModel.metadata.changed = Date.now();
      if (typeof viewModel.metadata.key == 'undefined') {
        console.warn("Unable to find key in metadata object...", viewModel.metadata);
        viewModel.metadata.key = mdkey;
      }
      global.localStorage.setItem("metadata-" + mdkey, viewModel.exportMetadata());
      global.localStorage.setItem("template-" + mdkey, viewModel.exportJSON());
      saveCmd.enabled(true);
    };
    var downloadCmd = {
      name: 'Download', // l10n happens in the template
      enabled: ko.observable(true)
    };
    downloadCmd.execute = function() {
      downloadCmd.enabled(false);
      viewModel.notifier.info(viewModel.t("Downloading..."));
      viewModel.exportHTMLtoTextarea('#downloadHtmlTextarea');
      var postUrl = emailProcessorBackend ? emailProcessorBackend : '/dl/';
      global.document.getElementById('downloadForm').setAttribute("action", postUrl);
      global.document.getElementById('downloadForm').submit();
      downloadCmd.enabled(true);
    };

    viewModel.save = saveCmd;
    viewModel.download = downloadCmd;
  }.bind(undefined, md.key, md.name);

  return commandsPlugin;
};

module.exports = lsLoader;
