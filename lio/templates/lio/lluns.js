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

Ext.define('Ext.oa.Lio__LogicalLun_Panel', {

  alias: 'widget.lio__logicallun_panel',
  extend: 'Ext.grid.Panel',
  store: (function(){
    Ext.define('blockdevice_volumes', {
      extend: 'Ext.data.Model',
      fields: [
        {name: "name"},
        {name: "vgname", mapping: "host", convert: toUnicode},
        {name: "status"},
        {name: "hostname", mapping: "host", convert: toUnicode}
      ]
    });
    return Ext.create('Ext.data.Store', {
      model: "blockdevice_volumes",
      autoLoad: true,
      proxy: {
        type: 'direct',
        directFn: volumes__BlockVolume.filter,
        extraParams: { kwds: {
          storageobj__filesystemvolume__isnull: true,
          storageobj__volumepool__isnull: true
        }},
        paramOrder: ["kwds"],
        startParam: undefined,
        limitParam: undefined,
        pageParam:  undefined
      }
    });
  }()),
  buttons: [{
    text: "",
    icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
    tooltip: gettext('Reload'),
    minWidth: 16,
    handler: function(){
      this.ownerCt.ownerCt.store.load();
    }
  }, {
    text: 'Edit LUN',
    icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
    handler: function(btn){
      var self = btn.ownerCt.ownerCt;
      var sm = self.getSelectionModel();
      if (sm.selected.items.length === 0){
        Ext.Msg.alert ("Warning","Please select a LUN you want to edit");
        return;
      };
      Ext.define('lio__HostACL_model', {
        extend: 'Ext.data.Model',
        fields: [
          {name: "hostname", mapping: "host", convert: toUnicode},
          {name: "lun_id"},
          {name: "id"},
          {name: "portals"}
        ]
      });
      var hostaclstore = Ext.create('Ext.data.Store', {
        model: "lio__HostACL_model",
        autoLoad: true,
        proxy: {
          type: 'direct',
          directFn: lio__HostACL.filter,
          extraParams: { kwds: { "volume": sm.selected.items[0].data.id }},
          paramOrder: ["kwds"],
          startParam: undefined,
          limitParam: undefined,
          pageParam:  undefined
        }
      });
      var editwin = new Ext.Window({  //Start des Edit Window
        title: interpolate(gettext('Edit LUN %s'),[sm.selected.items[0].data.name]),
        height: 350,
        width: 500,
        maximizable: true,
        layout: "fit",
        items: [{
          xtype: "tabpanel",  // Tabpanel wird definiert
          activeTab: 0,
          border: false,
          id:    "lio_logicallun_edit_tabpanel_inst",
          ref: "lio_logicallun_edit_tabpanel_inst",
          items: [{
            layout: "fit", // Tab Host and Groups - Start
            ref: "lun_edit_tabpanel_host_and_groups",
            title: gettext("Hosts"),
            id: "lun_edit_host_and_groups_tab",
            layout: 'border',
            items: [{
              region: 'center',
              xtype: 'grid',
              autoScroll: true,
              ref: 'lio_host_and_groups_tab_form',
              title: 'Host',
              border: false,
              forceFit: true,
              defaults: {
                sortable: true
              },
              store: hostaclstore,
              columns: [{
                header: gettext("Hostname"),
                dataIndex: "hostname"
              },{
                header: gettext("LUN ID"),
                dataIndex: "lun_id"
              }]
            }],
            buttons: [{ // Button Add und Remove
              text: 'Hostlist',
              icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
              ref: 'lio_lun_edit_save',
              id: 'lio_lun_edit_save',
              handler: function(self){
                var addwin = new Ext.Window({  //Start des Add Window
                  title: gettext('Add Host'),
                  height: 300,
                  width: 400,
                  maximizable: true,
                  layout: "fit",
                  items: [{
                    xtype: 'grid',
                    autoScroll: true,
                    selType : 'cellmodel',
                    title: 'Hosts',
                    border: false,
                    forceFit: true,
                    defaults: {
                      sortable: true
                    },
                    store: (function(){
                      Ext.define('ifconfig__Host_ids_model', {
                        extend: 'Ext.data.Model',
                        fields: [
                          "app",
                          "obj",
                          "id",
                          "__unicode__",
                          "share_lun_id"
                        ]
                      });
                      return Ext.create('Ext.data.Store', {
                        model: "ifconfig__Host_ids_model",
                        autoLoad: true,
                        proxy: {
                          type: 'direct',
                          directFn: ifconfig__Host.ids_filter,
                          extraParams: { kwds: {
                            initiator__isnull: false
                          }},
                          paramOrder: ["kwds"],
                          startParam: undefined,
                          limitParam: undefined,
                          pageParam:  undefined
                        }
                      });
                    }()),
                    listeners: {
                      cellClick: function(self, e, eOpts, record){
                        self.ownerCt.plugins[0].startEdit(record, self.ownerCt.columns[1]);
                      }
                    },
                    plugins: [
                      Ext.create('Ext.grid.plugin.CellEditing', {
                      })
                    ],
                    columns: [{
                      header: gettext("Hostname"),
                      dataIndex: "__unicode__"
                    },{
                      header: gettext("ID"),
                      dataIndex: "share_lun_id",
                      editor: {
                        xtype: 'numberfield',
                        minValue: -1,
                        maxValue: 100,
                        allowBlank: false
                      }
                    }]
                  }],
                  buttons:[{
                    text: 'Add',
                    icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                    ref: 'add_host',
                    id: 'add_host',
                    listeners: {
                      click: function(self, e, eOpts){
                        var sel = addwin.items.items[0].getSelectionModel();
                        if( sel.hasSelection() && (sel.selected.items[0].data.share_lun_id != "") ){
                          lio__HostACL.create({
                            'host': sel.selected.items[0].data,
                            'volume': {
                              "app": "volumes",
                              "obj": "BlockVolume",
                              "id":  sm.selected.items[0].data.id
                            },
                            'lun_id': sel.selected.items[0].data.share_lun_id,
                            'portals': [] // empty = all portals
                          },
                          function(provider, response){
                            if( response.result ){
                              hostaclstore.reload();
                              addwin.close();
                              editwin.show();
                            }
                          });
                        }
                        else
                        {
                          Ext.Msg.alert('Info', interpolate(
                          gettext('Please select a Host and enter an ID')))
                        }
                      }
                    }
                  },{
                    text: 'Close',
                    icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                    ref: 'hostlist_cancel',
                    id: 'hostlist_cancel',
                    handler: function(self){
                      addwin.close();
                      editwin.show();
                    }
                  }]
                });
                addwin.show();
              }
            },{
              text: 'Remove',
              icon: MEDIA_URL + "/icons2/16x16/actions/gtk-remove.png",
              ref: 'lio_lun_edit_cancel',
              id: 'lio_lun_edit_cancel',
              handler: function(self){
                var sel = editwin.items.items[0].items.items[0].items.items[0].getSelectionModel();
                if( sel.hasSelection() ){
                  self.ownerCt.ownerCt.getEl().mask(gettext("Loading..."));
                  lio__HostACL.remove(sel.selected.items[0].data.id,
                    function(provider, response){
                      if( response.type !== "exception" ){
                        hostaclstore.reload();
                        self.ownerCt.ownerCt.getEl().unmask();
                      }
                   }
                  );
                }
                else
                {
                  Ext.Msg.alert('Info', interpolate(
                    gettext('No Host selected for deletion')))
                  self.ownerCt.ownerCt.getEl().unmask();
                }
              }
            },{
                text: 'Close',
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(self){
                  editwin.close();
                }
              }]
          }]
        }]
      });
      editwin.show(); // editwin anzeigen
    }
  }],
  forceFit: true,
  columns: [{ // Oberes Column Grid mit der Anzeige der LUNs und ihren Eigenschaften
    header: gettext('Volume'),
    dataIndex: "name"
  }, {
    header: gettext('Status'),
    dataIndex: "status"
  }, {
    header: gettext('Group'),
    dataIndex: "vgname"
  }]
});

Ext.define('Ext.oa.Lio__Panel', {
  alias:'widget.lio__panel',
  extend: 'Ext.Panel',
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, { // Erstellen des Panel's für den Menüpunkt LUNs
      id: "lio__panel_inst",
      title: gettext('LUNs'),
      layout: 'border',
      items: [{
        xtype: "lio__logicallun_panel", // Obere Teil des Panels, LUN Übersicht etc. wird oben definiert
        id:    "lio__logicallun_panel_inst",
        region: "center",
        listeners: {
          cellclick: function( self, td, cellIndex, record, tr, rowIndex, e, eOpts ){
            Ext.getCmp("lun_name").setText(self.store.getAt(rowIndex).data["name"]);
          }
        }
      },{
        xtype: "tabpanel", // Unterer Teil des Panels. Tabpanel mit allen Infos und Details zu den LUNs
        region: "south",
        activeTab: 0,
        border: false,
        height: (Ext.core.Element.getViewHeight() - 100) / 3,
        id:    "lio_logicallun_south_tabpanel_inst",
        items: [{ // Description Tabpanel 
          layout: "fit", 
          ref: "lun_tabpanel_description",
          title: gettext("Details"),
          id: "lun_details_tab",
          bodyStyle: 'padding:5px 5px;',
          items: [{ //Fieldset erstellen, in das die Labels eingefasst werden
            xtype: 'fieldset',
            title: gettext('Infos'),
            layout: 'fit',
            forceFit: true,
            items: [{ // Festlegen der einzelnen Felder im Fieldset
              xtype: "label",
              name:  "lun_name",
              id: "lun_name",
              fieldLabel: gettext('Name')
            }, {
              xtype: "label",
              name:  "lun_path",
              fieldLabel: gettext('Path')
            }, {
              xtype: "label",
              name:  "lun_size",
              fieldLabel: gettext('Size')
            }, {
              xtype: "label",
              name:  "lun_status",
              fieldLabel: gettext('Status')
            }, {
              xtype: "label",
              name:  "lun_descpription",
              fieldLabel: gettext('Description')
            }]
          }] 
        }]        
      }]
    }));
    this.callParent(arguments);
  }
});


Ext.oa.Lio__LogicalLun_Module = {
  panel: "lio__panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_san", {
      text: gettext('LUNs'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/disk_use.png',
      panel: 'lio__panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Lio__LogicalLun_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
