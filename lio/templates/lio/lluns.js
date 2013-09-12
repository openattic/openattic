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
  buttons: [{
    text: 'Edit LUN',
    icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
    handler: function(self){
      var sm = self.scope.getSelectionModel();
      if (sm.selections.items.length === 0){
        Ext.Msg.alert ("Warning","Please select a LUN you want to edit");
        return;
      };
      var addwin = new Ext.Window({
        title: gettext('Edit LUN'),
        layout: "fit",
        height: 140,
        width: 500,
        items: [{
          xtype: "tabpanel",
          activeTab: 0,
          border: false,
          id:    "lio_logicallun_edit_tabpanel_inst",
          items: [{
            layout: "fit",
            ref: "lun_edit_tabpanel_overview",
            title: gettext("Overview"),
            id: "lun_edit_overview_tab",
            bodyStyle: 'padding:5px 5px;',
            items: [{
              xtype: 'fieldset',
              title: gettext('LUN Details'),
              layout: 'form',
              viewConfig: { forceFit: true },
              items: [{
                xtype: "label",
                name:  "lun_name_edit",
                id: "lun_name_edit",
                fieldLabel: gettext('Name'),
                text: sm.selections.items[0].data.volumename
              }]
            }]
          }, {
            layout: "fit",
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
          }]
        }]
      });
      addwin.show();
    }
  }],
  allowEdit: false,
  allowDelete: false,
  allowAdd: false,

  store: {
    fields: [{
      name: "volumename",
      mapping:  "volume",
      convert: toUnicode
    }]
  },
  columns: [{
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
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'LUN',
      layout: 'form',
      ref: 'lio_lun_column_form',
      items: [{
        xtype: 'volumefield',
        fieldLabel: gettext('Volume'),
        allowBlank: false,
        filesystem__isnull: true
      }, {
        xtype: 'numberfield',
        fieldLabel: gettext('LUN ID'),
        allowBlank: false,
        name: "lun_id",
      }]
    }]
  }
});


Ext.reg("lio__logicallun_panel", Ext.oa.Lio__LogicalLun_Panel);


Ext.oa.Lio__Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "lio__panel_inst",
      title: gettext('LUNs'),
      layout: 'border',
      items: [{
        xtype: "lio__logicallun_panel",
        id:    "lio__logicallun_panel_inst",
        region: "center",
        listeners: {
          cellclick: function( self, rowIndex, colIndex, evt ){
            Ext.getCmp("lun_name").setText(self.store.getAt(rowIndex).data["volumename"])
          }
        }
      },{
        xtype: "tabpanel",
        region: "south",
        activeTab: 0,
        border: false,
        height: (Ext.lib.Dom.getViewHeight() - 100) / 3,
        id:    "lio_logicallun_south_tabpanel_inst",
        items: [{
          layout: "fit",
          ref: "lun_tabpanel_description",
          title: gettext("Details"),
          id: "lun_details_tab",
          bodyStyle: 'padding:5px 5px;',
          items: [{
            xtype: 'fieldset',
            title: gettext('Infos'),
            layout: 'form',
            viewConfig: { forceFit: true },
            items: [{
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
        }, {
          ref: "lun_tabpanel_permissions",
          title: gettext("Mapped to Host/Group"),
          id: "lun_permissions_tab",
          viewConfig: { forceFit: true },
          html: "test"
        }, {
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
