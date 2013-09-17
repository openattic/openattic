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

Ext.oa.Lio__LogicalLun_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: lio__LogicalLUN,
  buttons: [{ // Edit Button für die LUN's
    text: 'Edit LUN',
    icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
    handler: function(self){
      var sm = self.scope.getSelectionModel();
      if (sm.selections.items.length === 0){
        Ext.Msg.alert ("Warning","Please select a LUN you want to edit");
        return;
      };
      var editwin = new Ext.Window({  //Start des Edit Window
        title: gettext('Edit LUN'),
        height: 600,
        width: 400,
        maximizable: true,
        layout: "fit",
        items: [{
          xtype: "tabpanel",  // Tabpanel wird definiert
          activeTab: 0,
          border: false,
          id:    "lio_logicallun_edit_tabpanel_inst",
          ref: "lio_logicallun_edit_tabpanel_inst",
          items: [{
            ref: "lun_edit_tabpanel_overview", // Overview Tab
            title: gettext("Overview"),
            id: "lun_edit_overview_tab",
            layout: "fit",
            bodyStyle: 'padding:5px 5px;',
            items: [{
              viewConfig: { forceFit: true },
              region: 'center',
              xtype: 'fieldset',
              title: gettext('LUN Details'),
              items: [{
                xtype: "label",
                name:  "lun_name_edit",
                id: "lun_name_edit",
                fieldLabel: gettext('Name'),
                text: sm.selections.items[0].data.volumename
              },{
                fieldLabel: gettext('Status'),
                name: "lun_status",
                ref: 'lun_status',
                hiddenName: 'lun_status',
                xtype:      'combo',
                store: [ [ 'online' ,gettext('Online')  ], [ 'offline', gettext('Offline') ] ],
                typeAhead:     true,
                editable: false,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                listeners: { // Wenn Offline als Status gewählt wird, alle Tabs, Buttons etc. disable
                  select: function(combo, record, index) {
                    if(combo.getValue() == "offline")
                    {
                      Ext.getCmp("lio_edit_lun_protokoll").setDisabled(true);
                      Ext.getCmp("lio_edit_adapters").setDisabled(true);
                      Ext.getCmp("lun_edit_bindip_tab").setDisabled(true);
                      Ext.getCmp("lun_edit_host_and_groups_tab").setDisabled(true);
                    }
                    else if (combo.getValue() == "online" && Ext.getCmp("lio_edit_lun_protokoll").getValue() == "fc"){
                      Ext.getCmp("lun_edit_bindip_tab").setDisabled(true);
                      Ext.getCmp("lio_lun_edit_new_iscsi_target").setDisabled(true);
                      Ext.getCmp("lio_edit_lun_protokoll").setDisabled(false);
                      Ext.getCmp("lio_edit_adapters").setDisabled(false);
                      Ext.getCmp("lun_edit_host_and_groups_tab").setDisabled(false)
                    }
                    else
                    {
                      Ext.getCmp("lio_edit_lun_protokoll").setDisabled(false);
                      Ext.getCmp("lio_edit_adapters").setDisabled(false);
                      Ext.getCmp("lun_edit_bindip_tab").setDisabled(false);
                      Ext.getCmp("lun_edit_host_and_groups_tab").setDisabled(false);
                      Ext.getCmp("lio_lun_edit_new_iscsi_target").setDisabled(false);
                    }
                  }
                },
              },{
                fieldLabel: gettext('Protokoll'),
                name: "lio_edit_lun_protokoll",
                ref: 'lio_edit_lun_protokoll',
                id: 'lio_edit_lun_protokoll',
                hiddenName: 'lun_protokoll',
                xtype:      'combo',
                store: [ [ 'iscsi', gettext('iSCSI')  ], [ 'fc', gettext('FibreChannel') ] ],
                typeAhead:     true,
                editable: false,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                listeners: { // Wenn FC als Protokoll gewählt wird, nicht brauchbare Tabs und Buttons disable
                  select: function(combo, record, index) {
                    if(combo.getValue() == "fc")
                    {
                      Ext.getCmp("lun_edit_bindip_tab").setDisabled(true);
                      Ext.getCmp("lio_lun_edit_new_iscsi_target").setDisabled(true);
                    }
                    else
                    {
                      Ext.getCmp("lun_edit_bindip_tab").setDisabled(false);
                      Ext.getCmp("lio_lun_edit_new_iscsi_target").setDisabled(false);
                    }
                  }
                },
              },{
                xtype: 'grid', // Grid zur Anzeige der Adapter - WWN und iSCSI Target im OverviewTab
                title: 'Adapters',
                region: 'south',
                id: 'lio_edit_adapters',
                border: false,
                viewConfig: { forceFit: true },
                autoScroll: true, 
                store: [["namer"]],
                colModel: (function(){
                  var cm = new Ext.grid.ColumnModel({
                    defaults: {
                      sortable: true
                    },
                    columns: [{
                      header: "Name",
                      dataIndex: "name"
                    }]
                  });
                  return cm;
                }()),
                buttons: [{ //Neues iSCSI Target anlegen - Button
                  text: 'New iSCSI Target',
                  icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
                  ref: 'lio_lun_edit_new_iscsi_target',
                  id: 'lio_lun_edit_new_iscsi_target',
                  handler: function(){
                  var fqdn = "";
                  __main__.fqdn(function(provider, response){
                      fqdn = response.result.split(".").join(".");
                  });
                  var addwin = new Ext.Window({ // Neues iSCSI Target - Window
                    title: gettext('Add Target'),
                    layout: "fit",
                    height: 140,
                    width: 500,
                    items: [{
                      xtype: "form",
                      autoScroll: true,
                      defaults: {
                        xtype: "textfield",
                        allowBlank: false,
                        anchor: "-20px"
                      },
                      bodyStyle: 'padding:5px 5px;',
                      items: [{
                        fieldLabel: gettext('Name'),
                        ref: "namefield",
                        listeners: { // Prüfung des Targetname und Autovervollständigung 
                          change: function( self, newValue, oldValue ){
                            var d = new Date();
                            var m = d.getMonth() + 1;
                            self.ownerCt.iqn_ip_field.setValue(
                              String.format("iqn.{0}-{1}.{2}:{3}",
                                d.getFullYear(), (m < 10 ? "0" + m : m),
                                fqdn, self.getValue()
                              )
                            );
                          }
                        }
                      },{
                        fieldLabel: gettext('IP/IQN'),
                        ref: "iqn_ip_field"
                      }],
                      buttons: [{ // Erstellen des neuen iSCSI Target
                        text: gettext('Create'),
                        icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                        handler: function(self){
                          if( !self.ownerCt.ownerCt.getForm().isValid() ){
                            return;
                          }
                          var re = new RegExp("[^A-Za-z0-9\-]");
                          if (re.test(self.ownerCt.ownerCt.namefield.getValue()))
                          {
                            Ext.Msg.alert("Warning","Illegal character in name");
                            return;
                          }
                          iscsi__Target.create({
                            'name': self.ownerCt.ownerCt.namefield.getValue(),
                            'iscsiname': self.ownerCt.ownerCt.iqn_ip_field.getValue()
                          }, function(provider, response){
                            if( response.result ) {
                              targetStore.reload();
                              addwin.hide();
                            }
                          });
                        }
                      }, {
                        text: gettext('Cancel'), // Abbruch und verlassen des Window - iSCSI Target erstellen
                        icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                        handler: function(self){
                          addwin.hide();
                        }
                      }]
                    }]
                  });
                  addwin.show(); // addwin anzeigen
                }
                }]
              }]
            }]
          }, {
            layout: "fit", // Tab Host and Groups - Start
            ref: "lun_edit_tabpanel_host_and_groups",
            title: gettext("Host and Groups"),
            id: "lun_edit_host_and_groups_tab",
            items: [{
              xtype: 'grid',
              autoScroll: true,
              ref: 'lio_host_and_groups_tab_form',
              title: 'Host and Groups',
              border: false,
              viewConfig: { forceFit: true },
              colModel: (function(){
                var cm = new Ext.grid.ColumnModel({
                  defaults: {
                    sortable: true,
                    viewConfig: { forceFit: true }
                  },
                  columns: [{
                    header: gettext("Map"),
                    dataIndex: "lio_edit_map"
                  },{
                    header: gettext("Name (Host/Group)"),
                    dataIndex: "lio_edit_name_host_group_"
                  },{
                    header: gettext("LUN ID"),
                    dataIndex: "lio_edit_lun_id"
                  }]
                });
                return cm;
              }()),
            }]
          }, {
            layout: "fit", // Tab BindIP - Start
            ref: "lun_edit_bindip_tap",
            title: gettext("BindIP"),
            id: "lun_edit_bindip_tab",
            items: [{
              xtype: 'grid',
              autoScroll: true,
              id: 'lio_bindip_tab_form',
              ref: 'lio_bindip_tab_form',
              title: 'BindIP',
              border: false,
              viewConfig: { forceFit: true },
              colModel: (function(){
                var cm = new Ext.grid.ColumnModel({
                  defaults: {
                    sortable: true,
                    viewConfig: { forceFit: true }
                  },
                  columns: [{
                    header: gettext("Map"),
                    dataIndex: "lio_edit_bindip_map"
                  },{
                    header: gettext("IP Adress"),
                    dataIndex: "lio_edit_bind_ipaddr"
                  }]
                });
                return cm;
              }()),
            }]
          }],
          buttons: [{ // Button Save und Cancel sind im ganzen Window sichtbar
            text: 'Save',
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            ref: 'lio_lun_edit_save',
            id: 'lio_lun_edit_save',
          },{
            text: 'Cancel',
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
            ref: 'lio_lun_edit_cancel',
            id: 'lio_lun_edit_cancel',
            handler: function(self){
              editwin.close();
            }
          }]
        }]
      });
      editwin.show(); // editwin anzeigen
    }
  }],
  allowEdit: false, // Default Edit Button deaktiviert 
  allowDelete: false, // Default Delete Button deaktivier
  allowAdd: false, // Default Add Button deaktivier

  store: { // Erzeugen des Stores für die LUN Ausgabe
    fields: [{
      name: "volumename",
      mapping:  "volume",
      convert: toUnicode
    }]
  },
  columns: [{ // Oberes Column Grid mit der Anzeige der LUN's und ihren Eigenschaften
    header: gettext('Volume'),
    width: 200,
    dataIndex: "volumename"
  }, {
    header: gettext('Group'),
    width:  50,
    dataIndex: "lun_group"
  }, {
    header: gettext('Status'),
    width:  50,
    dataIndex: "lun_status"
  }, {
    header: gettext('Size'),
    width:  50,
    dataIndex: "lun_size"
  }, {
    header: gettext('Protokoll'),
    width:  50,
    dataIndex: "lun_protokoll"
  }, {
    header: gettext('LUN ID'),
    width:  50,
    dataIndex: "lun_id"
  }]
});


Ext.reg("lio__logicallun_panel", Ext.oa.Lio__LogicalLun_Panel);


Ext.oa.Lio__Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";

    Ext.apply(this, Ext.apply(this.initialConfig, { // Erstellen des Panel's für den Menüpunkt LUNs
      id: "lio__panel_inst",
      title: gettext('LUNs'),
      layout: 'border',
      items: [{
        xtype: "lio__logicallun_panel", // Obere Teil des Panels, LUN Übersicht etc. wird oben definiert
        id:    "lio__logicallun_panel_inst",
        region: "center",
        listeners: {
          cellclick: function( self, rowIndex, colIndex, evt ){
            Ext.getCmp("lun_name").setText(self.store.getAt(rowIndex).data["volumename"]);
          }
        }
      },{
        xtype: "tabpanel", // Unterer Teil des Panels. Tabpanel mit allen Infos und Details zu den LUNs
        region: "south",
        activeTab: 0,
        border: false,
        height: (Ext.lib.Dom.getViewHeight() - 100) / 3,
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
            layout: 'form',
            viewConfig: { forceFit: true },
            items: [{ // Festlegen der einzelnen Felder im Fieldset
              xtype: "label",
              name:  "lun_name",
              id: "lun_name",
              fieldLabel: gettext('Name'),
            }, {
              xtype: "label",
              name:  "lun_path",
              fieldLabel: gettext('Path'),
            }, {
              xtype: "label",
              name:  "lun_size",
              fieldLabel: gettext('Size'),
            }, {
              xtype: "label",
              name:  "lun_status",
              fieldLabel: gettext('Status'),
            }, {
              xtype: "label",
              name:  "lun_descpription",
              fieldLabel: gettext('Description')
            }]
          }] 
        }, { // Permissons Tabpanel
          ref: "lun_tabpanel_permissions",
          title: gettext("Mapped to Host/Group"),
          id: "lun_permissions_tab",
          viewConfig: { forceFit: true },
          html: "test"
        }, { // Interfaces Tabpanel
          ref: "lun_tabpanel_shared_hosts",
          title: gettext("Interfaces"),
          id: "lun_shared_hosts_tab",
          viewConfig: { forceFit: true },
          html: "test"
        }]        
      }]
    }));
    Ext.oa.Lio__Panel.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("lio__panel", Ext.oa.Lio__Panel);


Ext.oa.Lio__LogicalLun_Module = Ext.extend(Object, {
  panel: "lio__panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_luns", {
      text: gettext('LUNs'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/disk_use.png',
      panel: 'lio__panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lio__LogicalLun_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
