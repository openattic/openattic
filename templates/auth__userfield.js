{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Auth__UserField = Ext.extend(Ext.form.ComboBox, {
  initComponent: function(){
    var baseParams = {
      "field": "username",
      "kwds": {},
      "query": ""
    };

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: "{% trans 'Owner' %}",
      store: (function(){
        var store = new Ext.data.DirectStore({
          fields: ["username", "id"],
          baseParams: { fields: ["username", "id"] },
          directFn: auth__User.all_values
        });
        store.setDefaultSort("username");
        return store;
      }()),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     "{% trans 'Select...' %}",
      selectOnFocus: true,
      displayField:  'username',
      valueField:    'id'
    }));
    Ext.oa.Auth__UserField.superclass.initComponent.apply(this, arguments);
  },

  setValue: function(value){
    // Make sure the store is loaded before trying to display stuff.
    if( !this.store.data.length ){
      var self = this;
      this.store.load({
        callback: function(){
          Ext.oa.Auth__UserField.superclass.setValue.apply(self, [value]);
        }
      });
    }
    else{
      Ext.oa.Auth__UserField.superclass.setValue.apply(this, arguments);
    }
  }
});

Ext.reg("authuserfield", Ext.oa.Auth__UserField);

// kate: space-indent on; indent-width 2; replace-tabs on;

