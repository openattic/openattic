var CephRBDStripingPreview = function () {

  this.stripingPreviewLink = element(by.css(".tc_stripingPreview"));
  this.stripes = element.all(by.css(".tc_stripe"));
  this.objectSets = element.all(by.css(".tc_objectSet"));
  this.objects = element.all(by.css(".tc_object"));
  this.stripUnits = element.all(by.css(".tc_stripUnit"));

  this.close = element(by.id("close"));

};
module.exports = CephRBDStripingPreview;
