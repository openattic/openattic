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


Ext.define('volumes__mdraid_Array_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'percent', 'status'
  ],
  createNode: function(record){
    console.log("volumes__mdraid_Array_model.createNode!");
    var rootNode;
    if( record.raw.member_set.length > 0 ){
      var store = Ext.create("Ext.oa.SwitchingTreeStore", {
        // See volumes/volumepools.js: volumes__volumes_VolumePool_model.createNode about this
        model: Ext.String.format('volumes__{0}_{1}_model', record.raw.member_set[0].app, record.raw.member_set[0].obj),
        root: record.data,
        proxy: {
          type: "direct",
          directFn: volumes__BlockVolume.filter,
          extraParams: {
            kwds: {
              upper: record.raw.volume
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
    rootNode.set("status", "OK");
    rootNode.commit();
    return rootNode;
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
