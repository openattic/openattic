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


Ext.define('volumes__zfs_Zfs_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
    rootNode.set("icon",     MEDIA_URL + '/icons2/16x16/apps/database.png');
    rootNode.set("host",     toUnicode(record.raw.host));
    rootNode.set("poolname", toUnicode(record.raw.pool));
    if( record.data.usedmegs !== null )
      rootNode.set("percent",    (record.data.usedmegs / record.data.megs * 100).toFixed(2));
    else
      rootNode.set("percent",    null);
    if( rootNode.get("name") === '' )
      rootNode.set("name", '[zpool] ' + toUnicode(record.raw.pool));
    rootNode.commit();
    return rootNode;
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
