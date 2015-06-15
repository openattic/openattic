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

Ext.define('volumes__twraid_Unit_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'percent', 'status', 'host', 'path',
    "index", "verify", "rebuild", "rdcache", "wrcache", "unittype", "autoverify", "serial", "chunksize"
  ],
  createNode: function(record){
    var rootNode;
    if( typeof record.raw.disk_set === "undefined" || record.raw.disk_set.length > 0 ){
      var store = Ext.create("Ext.oa.SwitchingTreeStore", {
        model: 'volumes__twraid_Disk_model',
        root: record.data,
        proxy: {
          type: "direct",
          directFn: twraid__Disk.filter,
          extraParams: {
            kwds: {
              unit__id: record.raw.id
            }
          },
          paramOrder: ["kwds"]
        }
      });
      rootNode = store.getRootNode();
    }
    else{
      record.set("leaf", true);
      rootNode = this.callParent(arguments);
    }
    rootNode.set("icon",    MEDIA_URL + '/oxygen/16x16/actions/distribute-horizontal-center.png');
    rootNode.set("percent", null);
    rootNode.set("type", record.raw.unittype);
    if( rootNode.get("status") === "VERIFYING" || rootNode.get("status") === "INITIALIZING" ){
      rootNode.set("status", rootNode.get("status") + ":" + record.raw.verify)
    }
    else if( rootNode.get("status") === "REBUILD" ){
      rootNode.set("status", "REBUILDING:" + record.raw.rebuild)
    }
    rootNode.set("host", toUnicode(record.raw.host));
    rootNode.commit();
    return rootNode;
  }
});

Ext.define('volumes__twraid_Disk_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'percent', 'status', 'path',
    "enclslot", "unitindex", "serial", "linkspeed", "power_on_h", "type", "port", "temp_c", "model", "rpm"
  ],
  createNode: function(record){
    record.set("leaf", true);
    var rootNode = this.callParent(arguments);
    if(rootNode.get("rpm") / 1000 == parseInt(rootNode.get("rpm") / 1000)){
      krpm = parseInt(rootNode.get("rpm") / 1000);
    }
    else{
      krpm = (rootNode.get("rpm") / 1000).toFixed(1);
    }
//     rootNode.set("id",   ["twraid__disk", rootNode.get("id"), Ext.id()].join('.'));
    rootNode.set("icon",    MEDIA_URL + '/oxygen/16x16/devices/drive-harddisk.png');
    rootNode.set("leaf", true);
    rootNode.set("percent", null);
    rootNode.set("type", Ext.String.format("{0} {1}k", rootNode.get("type"), krpm));
    rootNode.set("name", rootNode.get("model"));
    rootNode.commit();
    return rootNode;
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
