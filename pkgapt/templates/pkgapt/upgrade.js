{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Pkgapt__Upgrade_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var aptGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'pkgapt__upgrade_panel_inst',
      title: "{% trans 'APT' %}",
      viewConfig: { forceFit: true },
      buttons: [ {
        text: "{% trans 'Reload Changes list' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        handler: function(self, state){
          aptGrid.reload(Ext.state.Manager.get("pkgapt_distupgrade", true));
        }
      }, {
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        text: "{% trans 'Update Package lists' %}",
        handler: function(self){
          aptGrid.getEl().mask("Updating package lists...");
          pkgapt__Apt.update(function(provider, response){
            aptGrid.getEl().unmask();
            aptGrid.reload();
          });
        }
      }, {
        text: "{% trans 'Allow installation/deletion' %}",
        enableToggle: true,
        icon: MEDIA_URL + '/icons2/16x16/mimetypes/package.png',
        pressed: Ext.state.Manager.get("pkgapt_distupgrade", true),
        handler: function(self, state){
          Ext.state.Manager.set("pkgapt_distupgrade", self.pressed);
          aptGrid.reload(self.pressed);
        }
      }, {
        text: "{% trans 'Do Upgrade' %}",
        icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
        handler: function(self){
          aptGrid.getEl().mask("Upgrade is running...");
          pkgapt__Apt.do_upgrade(Ext.state.Manager.get("pkgapt_distupgrade", true), function(provider, response){
            aptGrid.getEl().unmask();
            aptGrid.reload();
          });
        }
      } ],
      store: {
        xtype: 'jsonstore',
        fields: ['name', 'candidate_version', 'installed_version',
          'marked_delete', 'marked_downgrade', 'marked_install', 'marked_upgrade']
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Name' %}",
          width: 200,
          dataIndex: "name"
        }, {
          header: "{% trans 'Installed Version' %}",
          width: 200,
          dataIndex: "installed_version"
        }, {
          header: "{% trans 'Candidate Version' %}",
          width: 200,
          dataIndex: "candidate_version"
        }, {
          header: "{% trans 'Action' %}",
          width: 200,
          dataIndex: "name",
          renderer: function( val, x, store ){
            if( store.data.marked_delete ){    return "Delete";    }
            if( store.data.marked_downgrade ){ return "Downgrade"; }
            if( store.data.marked_install ){   return "Install";   }
            if( store.data.marked_upgrade ){   return "Upgrade";   }
          }
        }]
      }),
      reload: function( dist_upgrade ){
        pkgapt__Apt.get_upgrade_changes(dist_upgrade, function(provider, response){
          aptGrid.setTitle(String.format(
            "APT: Upgrading {0}, newly installing {1}, deleting {2}, keeping {3} packages, downloading {4} MiB. ",
            response.result[0]['upgrade_count'], response.result[0]['new_install_count'],
            response.result[0]['delete_count'],  response.result[0]['keep_count'],
            (response.result[0]['req_download'] / 1024. / 1024.).toFixed(2)
          ) + String.format(
            (response.result[0]['req_space'] < 0 ? "{0} MiB will be freed." : "{0} MiB of additional disk space will be used."),
            (response.result[0]['req_space'] / 1024. / 1024.).toFixed(2)
          ));
          aptGrid.store.loadData(response.result[1]);
        });
      }
    }));
    Ext.oa.Pkgapt__Upgrade_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Pkgapt__Upgrade_Panel.superclass.onRender.apply(this, arguments);
    this.reload(Ext.state.Manager.get("pkgapt_distupgrade", true));
  }
});

Ext.reg("pkgapt__upgrade_panel", Ext.oa.Pkgapt__Upgrade_Panel);

Ext.oa.Pkgapt__Upgrade_Module = Ext.extend(Object, {
  panel: "pkgapt__upgrade_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: "{% trans 'Online Update' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/update.png',
      panel: 'pkgapt__upgrade_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Pkgapt__Upgrade_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
