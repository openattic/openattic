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

Ext.define("Ext.oa.SwitchingTreeStore", {
  extend: "Ext.data.TreeStore",
  onBeforeNodeExpand: function(node, callback, scope, args){
    // When expanding a Node, the TreeView unconditionally calls its store to do
    // the heavy lifting. This works as long as the Tree is not supposed to use
    // different stores for different tree "layers". Otherwise it fails, because
    // the TreeView's store is *not* the one that is supposed to do the actual
    // loading. So first of all, let's see if that's really one of our nodes...
    var store = node.store;
    console.log("onBeforeNodeExpand(" + (toUnicode(node.data) || node.data.name || node.data.text) + ") - this = " + this.model.modelName + "; node = " + store.model.modelName);
    if( store === this ){
      // ... if it is, we can expand it ourselves...
      return this.callParent(arguments);
    }
    else{
      // ... otherwise get the correct store and tell it to expand the node.
      return store.onBeforeNodeExpand(node, callback, scope, args);
    }
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
