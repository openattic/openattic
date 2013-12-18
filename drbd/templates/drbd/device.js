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

Ext.define('volumes__drbd_Connection_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'type', 'megs', 'status', 'host', 'path'
  ],
  createNode: function(record){
    var rootNode;
    if(record.raw.endpoint_set.length > 0){
      var store = Ext.create('Ext.oa.SwitchingTreeStore', {
        model: 'volumes__drbd_Endpoint_model',
        root: record.data,
        proxy: {
          type: 'direct',
          directFn: drbd__Endpoint.filter,
          extraParams: {
            kwds: {
              connection__id: record.get('id')
            }
          },
          paramOrder: ['kwds'],
          pageParam:  undefined,
          startParam: undefined,
          limitParam: undefined
        }
      });
      rootNode = store.getRootNode();
    }
    else {
      record.set("leaf", true);
      rootNode = this.callParent(arguments);
    }
    rootNode.set('icon', MEDIA_URL + '/icons2/16x16/apps/database.png');
    rootNode.set('name', toUnicode(record.raw));
    rootNode.set('megs', record.raw.megs);
    rootNode.set('percent', null);
    rootNode.set('status', record.raw.status);
    rootNode.set('path', record.raw.path);
    rootNode.set('type', record.data.type);
    rootNode.set('host', toUnicode(record.raw.host));
    rootNode.commit();
    return rootNode;
  }
});

Ext.define('volumes__drbd_Endpoint_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'connection', 'ipaddress', 'volume'
  ],
  createNode: function(record){
    record.set("leaf", true);
    var rootNode = this.callParent(arguments);
    rootNode.set('id', ["drbd_endpoint", record.raw.id, Ext.id()].join("."));
    rootNode.set('name', toUnicode(record.raw));
    rootNode.set('type', record.raw.type);
    rootNode.set('megs', record.raw.megs);
    rootNode.set('percent', null);
    rootNode.set('status', record.raw.status);
    rootNode.set('path', record.raw.path);
    rootNode.set('host', toUnicode(record.raw.host));
    if(record.raw.is_primary){
      rootNode.set("icon", MEDIA_URL + 'drbd_primary.png');
    }
    else {
      rootNode.set("icon", MEDIA_URL + 'drbd_secondary.png');
    }
    rootNode.commit();
    return rootNode;
  }
});

Ext.oa.getMirrorForm = function(config, window){
  var required = '<span style="color:red;font-weight:bold" data-qtip="Required">*</span>';
  var form = {
    xtype: 'form',
    border: false,
    bodyStyle: "padding:5px 5px;",
    items: [{
      xtype: 'combo',
      forceSelection: true,
      fieldLabel: gettext("Choose mirrorhost"),
      typeAhead: true,
      triggerAction: "all",
      deferEmptyText: false,
      emptyText: gettext("Select..."),
      itemId: "volumes_find_mirror_combo",
      selectOnFocus: true,
      displayField: "name",
      valueField: "id",
      allowBlank: false,
      afterLabelTextTpl: required,
      closeAction :'destroy',
      store: (function(){
        Ext.define("volumes__blockvolume_host_store", {
          extend: "Ext.data.Model",
          fields: [
            {name: "id"},
            {name: "name"}
          ]
        });

        return Ext.create("Ext.data.Store", {
          model: "volumes__blockvolume_host_store",
          proxy: {
            type: "direct",
            directFn: ifconfig__Host.filter,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined,
            extraParams: {
              kwds: {
                "__exclude__": {
                  "id": window.HOSTID
                }
              }
            },
            paramOrder: ["kwds"]
          }
        });
      }()),
      listeners: {
        change: function(self, newValue, oldValue, eOpts){
          var pool_combo = self.ownerCt.getComponent('volumes_find_volumepool_combo');
          pool_combo.enable();
          pool_combo.getStore().load({
            params: {
                "host_id": newValue,
                "min_megs": self.ownerCt.ownerCt.volume_megs
            }
          });

          ifconfig__Host.get_lowest_primary_ip_address_speed(newValue, function(result, response){
            if(response.type !== "exception"){
              var syncer_rate = result * 0.3;
              self.ownerCt.getComponent('volumes_advanced_settings_fieldset').items.getByKey('volumes_syncerrate_text').setValue(syncer_rate + "M");
            }
          });
        }
      }
    },{
      xtype: 'combo',
      disabled: true,
      forceSelection: true,
      fieldLabel: gettext("Choose volumepool"),
      typeAhead: true,
      deferEmptyText: false,
      emptyText: gettext("Select..."),
      itemId: "volumes_find_volumepool_combo",
      displayField: "name",
      valueField: "id",
      queryMode: "local",
      allowBlank: false,
      afterLabelTextTpl: required,
      store: (function(){
        Ext.define("volumes__blockvolume_volumepool_store", {
          extend: "Ext.data.Model",
          fields: [
            {name: "id"},
            {name: "name"}
          ]
        });

        return Ext.create("Ext.data.Store", {
          autoLoad: false,
          model: "volumes__blockvolume_volumepool_store",
          proxy: {
            type: "direct",
            directFn: volumes__VolumePool.get_sufficient,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined,
            paramOrder: ["host_id", "min_megs"]
          }
        });
      }()),
    },{
      xtype: 'fieldset',
      title: gettext('Advanced Settings'),
      collapsible: true,
      collapsed: true,
      layout: 'anchor',
      itemId: 'volumes_advanced_settings_fieldset',
      defaults: {
        anchor: '100%'
      },
      items: [{
        xtype: 'radiogroup',
        fieldLabel: gettext("Protocol"),
        columns: 1,
        itemId: "volumes_protocol_radio",
        items: [
          {name: "protocol", boxLabel: gettext("A: Asynchronous"), inputValue: "A"},
          {name: "protocol", boxLabel: gettext("B: Memory Synchronous (Semi-Synchronous)"), inputValue: "B"},
          {name: "protocol", boxLabel: gettext("C: Synchronous"), checked: true, inputValue: "C"}
        ]
      },{
        fieldLabel: gettext('Syncer Rate'),
        name: 'syncer_rate',
        xtype: 'textfield',
        itemId: 'volumes_syncerrate_text',
        value: '30M',
        regex: /^[0-9]+(M|G|K)/
      }]
    }],
    buttons: [{
      text: gettext("Choose"),
      icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
      listeners: {
        click: function(self, e, eOpts){
        }
      }
    },{
      text: gettext("Cancel"),
      icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
      listeners: {
        click: function(self, e, eOpts){
        }
      }
    }]
  };

  return form;
}

// kate: space-indent on; indent-width 2; replace-tabs on;
