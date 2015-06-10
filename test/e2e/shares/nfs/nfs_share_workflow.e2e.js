var helpers = require('../../common.js');

describe('NFS Share workflow', function(){
 
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var submitButton = element(by.css('.tc_submitButton'));
  var path = element(by.id('sharePath'));
  var options = element(by.id('shareOptions'));
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  
  beforeEach(function(){
    volumesItem.click();
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareAdd')).click();
    browser.sleep(400);
  });
  
  it('should have a "Create NFS Share" title', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create NFS Share');
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

  it('should have path field filled in with "/media/protractor_test_volume"', function(){
    expect(path.getAttribute('value')).toEqual("/media/protractor_test_volume");
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
  
});