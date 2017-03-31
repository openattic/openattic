var CephIscsiForm = function(){

  this.targetIdInput = element(by.model('model.targetId'));
  this.targetIdRequired = element(by.css('.tc_targetIdRequired'));
  this.targetIdInvalid = element(by.css('.tc_targetIdInvalid'));

  this.authenticationCheckbox = element(by.model('model.authentication.hasAuthentication'));
  this.userInput = element(by.model('model.authentication.user'));
  this.userRequired = element(by.css('.tc_userRequired'));
  this.passwordInput = element(by.model('model.authentication.password'));
  this.passwordRequired = element(by.css('.tc_passwordRequired'));

  this.initiatorsInput = element.all(by.model('model.authentication.initiators[$index]'));
  this.initiatorsRequired = element.all(by.css('.tc_InitiatorRequired'));
  this.initiatorsInvalid = element.all(by.css('.tc_InitiatorInvalid'));

  this.lunIdInput = element(by.model('settings.lun'));
  this.lunIdRequired = element(by.css('.tc_imageLunRequired'));

  this.mutualAuthenticationCheckbox = element(by.model('model.authentication.hasMutualAuthentication'));
  this.mutualUserInput = element(by.model('model.authentication.mutualUser'));
  this.mutualUserRequired = element(by.css('.tc_mutualUserRequired'));
  this.mutualPasswordInput = element(by.model('model.authentication.mutualPassword'));
  this.mutualPasswordRequired = element(by.css('.tc_mutualPasswordRequired'));

  this.discoveryAuthenticationCheckbox = element(by.model('model.authentication.hasDiscoveryAuthentication'));
  this.discoveryUserInput = element(by.model('model.authentication.discoveryUser'));
  this.discoveryUserRequired = element(by.css('.tc_discoveryUserRequired'));
  this.discoveryPasswordInput = element(by.model('model.authentication.discoveryPassword'));
  this.discoveryPasswordRequired = element(by.css('.tc_discoveryPasswordRequired'));

  this.discoveryMutualAuthenticationCheckbox = element(by.model('model.authentication.hasDiscoveryMutualAuthentication'));
  this.discoveryMutualUserInput = element(by.model('model.authentication.discoveryMutualUser'));
  this.discoveryMutualUserRequired = element(by.css('.tc_discoveryMutualUserRequired'));
  this.discoveryMutualPasswordInput = element(by.model('model.authentication.discoveryMutualPassword'));
  this.discoveryMutualPasswordRequired = element(by.css('.tc_discoveryMutualPasswordRequired'));

  this.submitButton = element(by.css('.tc_submitButton'));
  this.backButton = element(by.css('.tc_backButton'));

  this.addPortal = function(index){
    element(by.css('.tc_addPortalButton')).click();
    element.all(by.css('.tc_addPortalItem')).get(index).click();
  };

  this.addImage = function(index){
    element(by.css('.tc_addImageButton')).click();
    element.all(by.css('.tc_addImageItem')).get(index).click();
  };

  this.openImageSettingsModal = function(index){
    element.all(by.css('.tc_imageSettingsButton')).get(index).click();
  };

  this.confirmImageSettingsModal = function(){
    element(by.id('confirmButton')).click();
  };

  this.addInitiator = function(){
    element(by.css('.tc_addInitiatorButton')).click();
  };

  this.removeInitiator = function(index){
    element.all(by.css('.tc_initiatorRemoveButton')).get(index).click();
  };
};
module.exports = CephIscsiForm;