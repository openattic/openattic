var helpers = require('../../common.js');

describe('Should add a NFS Share', function(){

  var volumename = 'protractor_nfsShare_vol';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  //TODO -> shareAddress
  var shareAddress = 'srvoademo';
  var share = element(by.cssContainingText('td', shareAddress));
  var nfsShareTab = element(by.css('.tc_nfsShareTab'));

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, "xfs");
    volume.click();
    nfsShareTab.click();
  });

  it('should create the NFS share', function(){
    expect(volume.isDisplayed()).toBe(true);
    element(by.css('.tc_nfsShareAdd')).click();
    browser.sleep(400);
    element(by.model('share.address')).sendKeys(shareAddress);
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
  });

  it('should display the NFS share in the NFS panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    expect(share.isDisplayed()).toBe(true);
  });

  it('should remove the NFS share', function(){
    expect(volume.isDisplayed()).toBe(true);
    expect(share.isDisplayed()).toBe(true);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/nfs');
    browser.sleep(400);
  });

  it('should not show the NFS share anymore', function(){
    expect(volume.isDisplayed()).toBe(true);
    expect(share.isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('nfs_share');
    helpers.delete_volume(volume, volumename);
  });
});
