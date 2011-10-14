{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.VolumeField = Ext.extend(Ext.form.ComboBox, {
  initComponent: function(){
    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: "{% trans 'Volume' %}",
      name:       'volume',
      hiddenName: 'volume_id',
      store: new Ext.data.DirectStore({
        fields: ["id", "name"],
        directFn: lvm__LogicalVolume.filter_values,
        paramOrder: ["kwds", "fields"],
        baseParams: {"kwds": {"filesystem__isnull": false}, "fields": ["name"]}
      }),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     "{% trans 'Select...' %}",
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'volfield'
    }));
    Ext.oa.VolumeField.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("volumefield", Ext.oa.VolumeField);

// kate: space-indent on; indent-width 2; replace-tabs on;

