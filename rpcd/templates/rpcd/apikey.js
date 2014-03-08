/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.ApiKey_Panel', {
  extend: 'Ext.oa.ShareGridPanel',
  alias: "widget.apikey_panel",
  api: rpcd__APIKey,
  id: "apikey_panel_inst",
  title: gettext('API Keys'),
  texts: {
    add:     gettext('Add Key'),
    edit:    gettext('Edit Key'),
    remove:  gettext('Delete Key')
  },
  deleteConfirm: function(sel, handler, scope){
    Ext.Msg.confirm(
      this.texts.remove,
      interpolate(gettext("Do you really want to delete %(user)s's key '%(key)s'?"), {
        user: sel.data.ownername,
        key:  sel.data.description
      }, true),
      handler, scope
    );
  },
  store: {
    fields: [{
      name: 'ownername',
      mapping: 'owner',
      convert: toUnicode
    }, "apikey"]
  },
  buttons: [{
    text: gettext('Show API URL'),
    icon: MEDIA_URL + "/oxygen/16x16/actions/download.png",
    handler: function(btn){
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selected.items[0];
        __main__.fqdn(function(provider, response){
          Ext.Msg.prompt(gettext('API URL'),
            [ '<ul style="list-style: none; position: relative; left: -40px; width: 120%">',
                '<li>',
                  gettext('Use this URL to connect to the openATTIC API using the API Key you selected.'),
                '</li>',
                '<li>&nbsp;</li>',
                '<li>',
                  gettext('Note that the input field only allows for easier copy-paste, any value you enter here will be ignored.'),
                '</li>',
              '</ul>'].join(''),
            null, null, false,
            Ext.String.format("http://__:{0}@{1}:31234/", sel.data.apikey, response.result)
          );
        });
      }
    }
  }],
  columns: [{
    header: gettext('Description'),
    width: 200,
    dataIndex: "description"
  }, {
    header: gettext('Owner'),
    width: 50,
    dataIndex: "ownername"
  }, {
    header: gettext('Active'),
    width: 50,
    dataIndex: "active",
    renderer: Ext.oa.renderBoolean
  }],
  form: {
    items: [{
      xtype: 'auth__userfield',
      name: "owner"
    }, {
      fieldLabel: gettext('Description'),
      name: "description",
      ref: 'descriptionfield'
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('Active'),
      name: "active",
      ref: 'activefield'
    }]
  }
});



Ext.oa.ApiKey_Module = {
  panel: "apikey_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('API Keys'),
      icon: MEDIA_URL + '/oxygen/22x22/status/dialog-password.png',
      leaf: true,
      panel: 'apikey_panel_inst'
    });
  }
};

window.MainViewModules.push( Ext.oa.ApiKey_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
