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

Ext.define('Ext.oa.StorageObjectField', {
  alias: 'widget.storageobjectfield',
  extend: 'Ext.form.ComboBox',
  volumepool: null,
  blockvolume: null,
  filesystemvolume: null,
  initComponent: function(){
    var extraParams = {
      "field": "name",
      "query": "",
      "kwds":  {}
    };

    if( this.volumepool !== null )
      extraParams.kwds.volumepool__isnull = !this.volumepool;
    if( this.filesystemvolume !== null )
      extraParams.kwds.filesystemvolume__isnull = !this.filesystemvolume;
    if( this.blockvolume !== null )
      extraParams.kwds.blockvolume__isnull = !this.blockvolume;

    if( typeof this.extraParams !== "undefined" ){
        if( typeof this.extraParams.kwds !== "undefined" ){
            Ext.applyIf(extraParams.kwds, this.extraParams.kwds);
        }
        Ext.applyIf(extraParams, this.extraParams);
    }

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: gettext('Volume'),
      name: "volume",
      store: Ext.create('Ext.data.Store', {
        fields: ['id', '__unicode__'],
        proxy: {
          type: 'direct',
          directFn: volumes__StorageObject.filter_combo,
          paramOrder: ["field", "query", "kwds"],
          extraParams: extraParams
        }
      }),
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
      emptyText:     gettext('Select...'),
      allowBlank:    false,
      selectOnFocus: true,
      forceSelection: true,
      displayField:  '__unicode__',
      valueField:    'id',
      isLoading:     false
    }));
    this.callParent(arguments);
  },
  setValue: function(value){
    // Make sure the store is loaded before trying to display stuff.
    if( !this.store.data.length ){
      var self = this;
      self.isLoading = true;
      this.store.load({
        callback: function(){
          self.setValue(value);
          self.getEl().unmask();
        }
      });
    }
    else{
      this.callParent(arguments);
    }
  },
  onRender: function(){
    this.callParent(arguments);
    console.log("onRender!");
    console.log(this);
    if( this.isLoading )
      this.getEl().mask(gettext("Loading..."));
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;

