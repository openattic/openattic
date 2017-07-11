var SettingsForm = function(){

  this.saltApiHost = element(by.model('$ctrl.model.deepsea.host'));
  this.saltApiHostRequired = element(by.css('.tc_saltApiHostRequired'));
  this.saltApiPort = element(by.model('$ctrl.model.deepsea.port'));
  this.saltApiPortRequired = element(by.css('.tc_saltApiPortRequired'));
  this.saltApiEauth = element(by.model('$ctrl.model.deepsea.eauth'));
  this.saltApiEauthRequired = element(by.css('.tc_saltApiEauthRequired'));
  this.saltApiUsername = element(by.model('$ctrl.model.deepsea.username'));
  this.saltApiUsernameRequired = element(by.css('.tc_saltApiUsernameRequired'));
  this.saltApiSharedSecret = element(by.model('$ctrl.model.deepsea.shared_secret'));
  this.saltApiSharedSecretRequired = element(by.css('.tc_saltApiSharedSecretRequired'));
  this.saltApiConnectionSuccess = element(by.css('.tc_deepseaConnectionSuccess'));
  this.saltApiConnectionFail = element(by.css('.tc_deepseaConnectionFail'));

  this.rgwManagedByDeepSea = element(by.model('$ctrl.model.rgw.managed_by_deepsea'));
  this.rgwHost = element(by.model('$ctrl.model.rgw.host'));
  this.rgwPort = element(by.model('$ctrl.model.rgw.port'));
  this.rgwAccessKey = element(by.model('$ctrl.model.rgw.access_key'));
  this.rgwSecretKey = element(by.model('$ctrl.model.rgw.secret_key'));
  this.rgwAdminUser = element(by.model('$ctrl.model.rgw.user_id'));
  this.rgwUseSSL = element(by.model('$ctrl.model.rgw.use_ssl'));
  this.rgwConnectionSuccess = element(by.css('.tc_rgwConnectionSuccess'));
  this.rgwConnectionFail = element(by.css('.tc_rgwConnectionFail'));

  this.submitButton = element(by.css('.tc_submitButton'));

  this.selectEauth = function(text){
    element(by.model('$ctrl.model.deepsea.eauth')).all(by.cssContainingText('option', text)).click();
  };

  this.checkManagedByDeepSea = function(value){
    var checkbox = element(by.model('$ctrl.model.rgw.managed_by_deepsea'));
    checkbox.isSelected().then(function(selected){
      if(selected !== value){
        checkbox.click();
      }
    });
  };

  this.checkUseSSL = function(value){
    var checkbox = element(by.model('$ctrl.model.rgw.use_ssl'));
    checkbox.isSelected().then(function(selected){
      if(selected !== value){
        checkbox.click();
      }
    });
  };

};
module.exports = SettingsForm;
