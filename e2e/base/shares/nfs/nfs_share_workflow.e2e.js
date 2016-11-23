var helpers = require('../../../common.js');

describe('NFS Share workflow', function(){

  var volumename = 'protractor_nfsworkflow_vol';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var submitButton = element(by.css('.tc_submitButton'));
  var path = element(by.model('share.path'));
  var options = element(by.id('shareOptions'));
  var nfsShareTab = element(by.css('.tc_nfsShareTab'));

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, "xfs");
    volume.click();
    nfsShareTab.click();
    element(by.css('.tc_nfsShareAdd')).click();
  });

  it('should have a "Create NFS Share" title', function(){
    expect(element(by.css('.tc_formHeadline h3')).getText()).toEqual('Create NFS Share');
  });

  it('should have the input field "Path"', function(){
    expect(element(by.id('sharePath')).isDisplayed()).toBe(true);
  });

  it('should have the input field "Address"', function(){
    expect(element(by.id('shareAddress')).isDisplayed()).toBe(true);
  });

  it('should have the input field "Options"', function(){
    expect(element(by.id('shareOptions')).isDisplayed()).toBe(true);
  });

  //path changes if volume is i.e. a btrfs vol
  it('should have path field filled in with "/media/<volumename>"', function(){
    expect(path.getAttribute('value')).toEqual("/media/" + volumename);
  });

  it('should have options field filled in with "rw,no_subtree_check,no_root_squash"', function(){
    expect(options.getAttribute('value')).toEqual("rw,no_subtree_check,no_root_squash");
  });

  it('should show required message if path is empty', function(){
    path.clear();
    submitButton.click();
    expect(element(by.css('.tc_pathRequired')).isDisplayed()).toBe(true);
  });

  it('should show required message if address is empty', function(){
    var address = element(by.id('shareAddress'));
    address.clear();
    submitButton.click();
    expect(element(by.css('.tc_addressRequired')).isDisplayed()).toBe(true);
  });

  //TODO
  //   it('should show an error message if address is not in the correct format', function(){
  //
  //   });

  it('should have a submit button', function(){
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should go back to nfs panel when back button was pressed', function(){
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_nfs_shares')).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('nfs_share -> nfs_share_workflow.e2e.js');
  });

});
