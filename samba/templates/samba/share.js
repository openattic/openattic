{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var sambaShareGrid = this;
    var renderBoolean = function (val, x, store){
     if (val)
       return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
     return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
      };
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'Samba' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
        sambaShareGrid.store.reload();
        }
      },{
        text: "{% trans "Add Share" %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans "Add Share" %}",
            layout: "fit",
            height: 500,
            width: 500,
            items: [{
              xtype: "form",
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [{ 
                fieldLabel: "Name",
                allowBlank: false,
                name: "name",
                ref: 'namefield'
              }, {
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: "{% trans 'Volume' %}",
                name:       'volume',
                hiddenName: 'volume_id',
                store: new Ext.data.DirectStore({
                  fields: ["app", "obj", "id", "name"],
                  directFn: lvm__LogicalVolume.ids
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                displayField:  'name',
                valueField:    'id',
                ref:           'volfield',
                listeners: {
                    select: function(self, record, index){
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        if( !response.result.filesystem ){
                          alert("{% trans 'This volume does not have a file system, so it cannot be used for Samba share.' %}");
                          self.ownerCt.dirfield.setValue("");
                          self.ownerCt.dirfield.disable();
                          self.expand();
                        }
                        else{
                          self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                          self.ownerCt.dirfield.enable();
                        }
                      } );
                    }
                  }
              }, {
                fieldLabel: "{% trans "Path" %}",
                allowBlank: false,
                name: "path",
                ref: 'dirfield'
              }, {
                xtype:      'combo',
                allowBlank: true,
                fieldLabel: "{% trans 'Owner' %}",
                name:       'owner',
                hiddenName: 'owner_id',
                store: new Ext.data.DirectStore({
                  fields: ["username", "id"],
                  baseParams: { fields: ["username", "id"] },
                  directFn: auth__User.all_values
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     "{% trans 'Select...' %}",
                selectOnFocus: true,
                displayField:  'username',
                valueField:    'username',
                ref:      'ownerfield'
              },{
                fieldLabel: "{% trans "Group" %}",
                allowBlank: true,
                name: "group",
                ref: 'groupfield'
              },{
                fieldLabel: "{% trans "Browseable" %}",
                allowBlank: false,
                name: "browseable",
                ref: 'browseablefield',
                value:     'True'
              },{
                fieldLabel: "{% trans "Available" %}",
                allowBlank: false,
                name: "available",
                ref: 'availablefield',
                value:     'True'
              },{
                fieldLabel: "{% trans "Writeable" %}",
                allowBlank: false,
                name: "writeable",
                ref: 'writeablefield',
                value:     'True'
              },{
                fieldLabel: "{% trans "Comment" %}",
                allowBlank: true,
                name: "comment",
                ref: 'commentfield'
              },{
                fieldLabel: "{% trans "Create Mode" %}",
                allowBlank: false,
                name: "create mode",
                ref: 'createmodefield',
                value:     '0664'
              },{
                fieldLabel: "{% trans "State" %}",
                allowBlank: false,
                name: "state",
                ref: 'statefield',
                value:     'active'
              },{
                fieldLabel: "{% trans "Guest OK" %}",
                allowBlank: false,
                name: "guest ok",
                ref: 'guestokfield',
                value:     'True'
              },{
                fieldLabel: "{% trans "Dir Mode" %}",
                allowBlank: false,
                name: "dir mode",
                ref: 'dirmodefield',
                value:     '0775'
              }
              ],
                buttons: [{
                text: "{% trans 'Create Share' %}",
                icon: MEDIA_URL + "/icons/accept.png",
                handler: function(self){
                  samba__Share.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'force_user':       self.ownerCt.ownerCt.ownerfield.getValue(),
                    'browseable':       self.ownerCt.ownerCt.browseablefield.getValue(),
                    'available':        self.ownerCt.ownerCt.availablefield.getValue(),
                    'force_group':      self.ownerCt.ownerCt.groupfield.getValue(),
                    'writeable':        self.ownerCt.ownerCt.writeablefield.getValue(),
                    'comment':          self.ownerCt.ownerCt.commentfield.getValue(),
                    'create_mode':      self.ownerCt.ownerCt.createmodefield.getValue(),
                    'state':            self.ownerCt.ownerCt.statefield.getValue(),
                    'guest_ok':         self.ownerCt.ownerCt.guestokfield.getValue(),
                    'dir_mode':         self.ownerCt.ownerCt.dirmodefield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      sambaShareGrid.store.reload();
                      addwin.hide();
                    }
                  });
                }
              }, {
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
      }, {
        text: "{% trans 'Delete Share' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = sambaShareGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Delete Share' %}",
              interpolate(
                "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
                function(btn){
                  if(btn == 'yes'){
                    samba__Share.remove( sel.id, function(provider, response){
                    sambaShareGrid.store.reload();
            } );
          }
        });
      }
        }}
      ],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state', 'available'],
        directFn: samba__Share.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
          
        }, {
          header: "{% trans 'State' %}",
          width: 50,
          dataIndex: "state",
          renderer: renderBoolean
        }, {
          header: "{% trans 'Available' %}",
          width: 70,
          dataIndex: "available",
          renderer: renderBoolean
        }]
      }),
     }));
    Ext.oa.Samba__Share_Panel.superclass.initComponent.apply(this, arguments);
  },
  
//   Ext.apply(this, Ext.apply(this.initialConfig, {
//     title: ""
//     
//     
//   }

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'Windows (Samba)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
