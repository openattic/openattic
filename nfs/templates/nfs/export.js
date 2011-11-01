{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'nfs__export_panel_inst',
      title: "{% trans 'NFS' %}",
      viewConfig: { forceFit: true },
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nfsGrid.store.reload();
          }
        }, {
        text: "{% trans 'Add Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Export' %}",
            layout: "fit",
            height: 300,
            width: 500,
            items: [{
              xtype: "form",
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [
                tipify({
                  xtype: 'volumefield',
                  listeners: {
                    select: function(self, record, index){
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                        self.ownerCt.dirfield.enable();
                      } );
                    }
                  }
                }, "{% trans 'Please select the volume to share.' %}"),
              tipify({
                  fieldLabel: "{% trans 'Directory' %}",
                  name: "path",
                  disabled: true,
                  ref: 'dirfield'
                }, "{% trans 'If you wish to share only a subpath of the volume, enter the path here.' %}" ),
              {
                fieldLabel: "{% trans 'Address' %}",
                name: "address",
                ref: 'addrfield'
              }, {
                fieldLabel: "{% trans 'Options' %}",
                name: "options",
                ref: 'optfield',
                value: "rw,no_subtree_check,no_root_squash"
              }],
              buttons: [{
                text: "{% trans 'Create Export' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  nfs__Export.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'options': self.ownerCt.ownerCt.optfield.getValue(),
                    'address': self.ownerCt.ownerCt.addrfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      nfsGrid.store.reload();
                      addwin.hide();
                    }
                  });
                }
              },{
                text: "{% trans 'Cancel' %}",
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(self){
                  addwin.hide();
                }
              }]
            }]
          });
          addwin.show();
        }
      },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = nfsGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            var addwin = new Ext.Window({
              title: "Edit",
              layout: "fit",
              height: 200,
              width: 500,
              items: [{
                xtype: "form",
                defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                  fieldLabel: "Volume",
                  name: "volume",
                  readOnly: true,
                  disabled: true,
                  ref: 'volumefield',
                  
                  value: sel.json.volume.name
                },{
                  fieldLabel: "Directory",
                  name: "directory",
                  ref: 'directoryfield',
                  value: sel.data.path
                },{
                  fieldLabel: "Address",
                  name: "address",
                  ref: 'addressfield',
                  value: sel.data.address
                },{
                  fieldLabel: "Options",
                  name: "options",
                  ref: 'optionsfield',
                  value: sel.data.options
                }],
                buttons: [{
                  text: 'Save',
                  handler: function(self){
                    var sm = nfsGrid.getSelectionModel();
                    if( sm.hasSelection() ){
                      var sel = sm.selections.items[0];
                      nfs__Export.set(sel.data.id, {
                        'path':    self.ownerCt.ownerCt.directoryfield.getValue(),
                        'address':  self.ownerCt.ownerCt.addressfield.getValue(),
                        'options':   self.ownerCt.ownerCt.optionsfield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          
                          addwin.hide();
                        }
                      });
                    }
                  }
                }]
              }]
            });
            addwin.show();
          }
        }
      },{
        text: "{% trans 'Delete Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = nfsGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Delete Export' %}",
              interpolate(
                "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
                function(btn){
                  if(btn == 'yes'){
                    nfs__Export.remove( sel.data.id, function(provider, response){
                    nfsGrid.store.reload();
                  } );
                }
              });
            }
          }
        }
      ],
      store: {
        xtype: 'directstore',
        fields: ['id', 'address', 'path', 'options', 'state'],
        directFn: nfs__Export.all
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Address' %}",
          width: 100,
          dataIndex: "address"
        }, {
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'Options' %}",
          width: 200,
          dataIndex: "options"
        }]
      })
    }));
    Ext.oa.Nfs__Export_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Nfs__Export_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("nfs__export_panel", Ext.oa.Nfs__Export_Panel);

Ext.oa.Nfs__Export_Module = Ext.extend(Object, {
  panel: "nfs__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Linux (NFS)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'nfs__export_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Nfs__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
