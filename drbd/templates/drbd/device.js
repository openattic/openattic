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
    console.log(record.raw);
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
    console.log(record);
    var rootNode = this.callParent(arguments);
    rootNode.set('name', toUnicode(record.raw));
    rootNode.set('type', record.raw.type);
    rootNode.set('megs', record.raw.megs);
    rootNode.set('percent', null);
    rootNode.set('status', record.raw.status);
    rootNode.set('path', record.raw.path);
    rootNode.set('host', toUnicode(record.raw.host));
    rootNode.commit();
    return rootNode;
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
