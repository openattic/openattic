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

Ext.define('Ext.oa.Tftp__Instance_Panel', {

  alias: 'widget.tftp__instance_panel',
  extend: 'Ext.oa.ShareGridPanel',
  api: tftp__Instance,
  id: "tftp__instance_panel_inst",
  title: gettext("TFTP"),
  allowEdit: false,
  columns: [{
    header: gettext('Path'),
    width: 200,
    dataIndex: "path"
  }, {
    header: gettext('Address'),
    width: 100,
    dataIndex: "address_ip"
  }],
  store: {
    fields: [{
      name: "address_ip",
      mapping: "address",
      convert: toUnicode
    }]
  },
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'TFTP',
      layout: 'form',
      items: [
        tipify({
          xtype: 'filesystemvolumefield',
          listeners: {
            select: function(self, record, index){
              var addrfield = Ext.ComponentQuery.query("[name=address]", self.ownerCt)[0];
              var dirfield  = Ext.ComponentQuery.query("[name=path]", self.ownerCt)[0];
              volumes__FileSystemVolume.get( record[0].data.id, function( result, response ){
                dirfield.setValue( result.path );
                dirfield.enable();
              } );
              addrfield.clearValue();
              addrfield.store.proxy.extraParams.idobj.id = record[0].data.id;
              addrfield.store.load();
              addrfield.enable();
            }
          }
        }, gettext('Please select the volume to share.')),
        tipify({
          xtype: 'textfield',
          fieldLabel: gettext('Directory'),
          name: "path",
          disabled: true
        }, gettext('If you wish to share only a subpath of the volume, enter the path here.') ), {
          xtype:      'combo',
          fieldLabel: gettext('Address'),
          allowBlank: false,
          name: 'address',
          store: (function(){
            Ext.define('tftp_model', {
              extend: 'Ext.data.Model',
              fields: ["app", "obj", "id", "__unicode__"]
            });
            return Ext.create('Ext.data.Store', {
              model: "tftp_model",
              proxy: {
                type: 'direct',
                startParam: undefined,
                limitParam: undefined,
                pageParam:  undefined,
                directFn: ifconfig__IPAddress.get_valid_ips,
                extraParams: {
                  "idobj": {
                    "app": "volumes", "obj": "FileSystemVolume", "id": -1
                  }
                }
              }
            });
          }()),
          disabled:      true,
          typeAhead:     true,
          triggerAction: 'all',
          deferEmptyText: false,
          emptyText:     gettext('Select...'),
          selectOnFocus: true,
          displayField:  '__unicode__',
          valueField:    'id'
        }
      ]
    }]
  }
});


Ext.oa.Tftp__Instance_Module = {
  panel: "tftp__instance_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Embedded (TFTP)'),
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/categories/preferences-other.png',
      panel: 'tftp__instance_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Tftp__Instance_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
