/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.Nfs__Export_Panel', {

  alias: 'widget.nfs__export_panel',
  extend: 'Ext.oa.ShareGridPanel',
  api: nfs__Export,
  id: "nfs__export_panel_inst",
  title: "NFS",
  columns: [{
    header: gettext('Address'),
    width: 100,
    dataIndex: "address"
  }, {
    header: gettext('Path'),
    width: 200,
    dataIndex: "path"
  }, {
    header: gettext('Options'),
    width: 200,
    dataIndex: "options"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'NFS Export',
      layout: 'form',
      items: [
        tipify({
          xtype: 'volumefield',
          listeners: {
            select: function(self, record, index){
              var dirfield = Ext.ComponentQuery.query("[name=path]", self.ownerCt)[0];
              lvm__LogicalVolume.get( record[0].data.id, function( provider, response ){
                dirfield.setValue( response.result.fs.topleveldir );
                dirfield.enable();
              } );
            }
          }
        }, gettext('Please select the volume to share.')),
        tipify({
          xtype: 'textfield',
          fieldLabel: gettext('Directory'),
          name: "path",
          disabled: true
        }, gettext('If you wish to share only a subpath of the volume, enter the path here.') ),
        {
          xtype: 'textfield',
          fieldLabel: gettext('Address'),
          allowBlank: false,
          name: "address",
          ref: 'addrfield',
          id: 'addrfield',
        }, {
          xtype: 'textfield',
          fieldLabel: gettext('Options'),
          name: "options",
          ref: 'optfield',
          id: 'optfield',
          value: "rw,no_subtree_check,no_root_squash"
        }, {
          xtype: 'label',
          html:  gettext(
            'See <a href="http://man.cx/exports%285%29" target="_blank">the NFS manual</a> for details.'
          ),
          cls: "form_hint_label"
        }
      ]
    }]
  }
});


Ext.oa.Nfs__Export_Module = {
  panel: "nfs__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Linux (NFS)'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'nfs__export_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Nfs__Export_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
