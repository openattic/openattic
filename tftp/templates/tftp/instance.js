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

Ext.oa.Tftp__Instance_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: tftp__Instance,
  id: "tftp__instance_panel_inst",
  title: gettext("TFTP"),
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
          xtype: 'volumefield',
          listeners: {
            select: function(self, record, index){
              "use strict";
              lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                self.ownerCt.dirfield.enable();
              } );
              self.ownerCt.addrfield.clearValue();
              self.ownerCt.addrfield.store.baseParams.idobj.id = record.data.id;
              self.ownerCt.addrfield.store.reload();
              self.ownerCt.addrfield.enable();
            }
          }
        }, gettext('Please select the volume to share.')),
        tipify({
          xtype: 'textfield',
          fieldLabel: gettext('Directory'),
          name: "path",
          disabled: true,
          ref: 'dirfield'
        }, gettext('If you wish to share only a subpath of the volume, enter the path here.') ),
        {
          xtype:      'combo',
          fieldLabel: gettext('Address'),
          ref:        'addrfield',
          allowBlank: false,
          hiddenName: 'address',
          store: new Ext.data.DirectStore({
            fields: ["app", "obj", "id", "__unicode__"],
            directFn: ifconfig__IPAddress.get_valid_ips,
            baseParams: {
              "idobj": {
                "app": "lvm", "obj": "LogicalVolume", "id": -1
              }
            }
          }),
          disabled:      true,
          typeAhead:     true,
          triggerAction: 'all',
          emptyText:     gettext('Select...'),
          selectOnFocus: true,
          displayField:  '__unicode__',
          valueField:    'id'
        }
      ]
    }]
  }
});


Ext.reg("tftp__instance_panel", Ext.oa.Tftp__Instance_Panel);

Ext.oa.Tftp__Instance_Module = Ext.extend(Object, {
  panel: "tftp__instance_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Embedded (TFTP)'),
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/categories/preferences-other.png',
      panel: 'tftp__instance_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Tftp__Instance_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
