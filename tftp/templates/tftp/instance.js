{% load i18n %}

{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

Ext.oa.Tftp__Instance_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: tftp__Instance,
  id: "tftp__instance_panel_inst",
  title: "TFTP",
  columns: [{
    header: "{% trans 'Path' %}",
    width: 200,
    dataIndex: "path"
  }, {
    header: "{% trans 'Address' %}",
    width: 100,
    dataIndex: "address_ip"
  }],
  storefields: [{
    name: "address_ip",
    mapping: "address",
    convert: function(val){
      "use strict";
      if(val){
        return val.address;
      }
      return "";
    }
  }],
  form: {
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
          }
        }
      }, "{% trans 'Please select the volume to share.' %}"),
      tipify({
        xtype: 'textfield',
        fieldLabel: "{% trans 'Directory' %}",
        name: "path",
        disabled: true,
        ref: 'dirfield'
      }, "{% trans 'If you wish to share only a subpath of the volume, enter the path here.' %}" ),
      {
        xtype:      'combo',
        fieldLabel: "{% trans 'Address' %}",
        name:       "address",
        ref:        'addrfield',
        allowBlank: false,
        hiddenName: 'address',
        store: new Ext.data.DirectStore({
          fields: ["app", "obj", "id", "address"],
          baseParams: {fields: ["app", "obj", "id", "address"] },
          directFn: ifconfig__IPAddress.ids
        }),
        typeAhead:     true,
        triggerAction: 'all',
        emptyText:     "{% trans 'Select...' %}",
        selectOnFocus: true,
        displayField:  'address',
        valueField:    'id'
      }
    ]
  }
});


Ext.reg("tftp__instance_panel", Ext.oa.Tftp__Instance_Panel);

Ext.oa.Tftp__Instance_Module = Ext.extend(Object, {
  panel: "tftp__instance_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Embedded (TFTP)' %}",
      leaf: true,
      icon: MEDIA_URL + '/oxygen/22x22/categories/preferences-other.png',
      panel: 'tftp__instance_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Tftp__Instance_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
