'use strict';

var helpers = require('../../common.js');
var CephRgwCommons = require('./cephRgwCommon.js');

describe('ceph rgw buckets', function(){
  var cephRgwCommons = new CephRgwCommons();
  var testUser = {
    user_id: 'e2e_tuxdoe',
    display_name: 'Tux Doe'
  };
  var testBucket = {
    name: 'e2e_bucket',
    owner: 'e2e_tuxdoe'
  };

  var addBucket = function() {
    cephRgwCommons.addBucket();
    expect(browser.getCurrentUrl()).toContain('/ceph/rgw/buckets/add');
  };

  var editBucket = function(name) {
    cephRgwCommons.editBucket(name);
    expect(browser.getCurrentUrl()).toMatch('/ceph/rgw/buckets/edit/' + name);
  };

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('.tc_menuitem_ceph_rgw')).click();
    element(by.css('.tc_submenuitem_ceph_rgw_buckets')).click();
    browser.sleep(helpers.configs.sleep);
  });

  it('should create test user', function(){
    element(by.css('.tc_menuitem_ceph_rgw')).click();
    element(by.css('.tc_submenuitem_ceph_rgw_users')).click();
    browser.sleep(helpers.configs.sleep);
    cephRgwCommons.addUser();
    expect(browser.getCurrentUrl()).toContain('/ceph/rgw/users/add');
    element(by.model('user.user_id')).sendKeys(testUser.user_id);
    element(by.model('user.display_name')).sendKeys(testUser.display_name);
    cephRgwCommons.submitBtn.click();
  });

  it('should display the test user in the users panel', function(){
    element(by.css('.tc_menuitem_ceph_rgw')).click();
    element(by.css('.tc_submenuitem_ceph_rgw_users')).click();
    expect(helpers.get_list_element(testUser.user_id).isDisplayed()).toBe(true);
  });

  it('should check the invalid bucket name error message', function(){
    addBucket();
    element(by.model('bucket.bucket')).sendKeys("xy");
    // Wait some time until the bucket name has been validated via REST API call.
    browser.sleep(helpers.configs.sleep);
    expect(element(by.css('.tc_bucketInvalid')).isDisplayed()).toBe(true);
    element(by.css('.tc_backButton')).click();
    element(by.css('.tc_leaveButton')).click();
  });

  it('should create test bucket (owner=admin)', function(){
    addBucket();
    element(by.model('bucket.bucket')).sendKeys(testBucket.name);
    element(by.model('bucket.owner')).sendKeys('admin');
    cephRgwCommons.submitBtn.click();
  });

  it('should display the new bucket in the buckets panel', function(){
    expect(helpers.get_list_element(testBucket.name).isDisplayed()).toBe(true);
    var cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual('admin');
  });

  it('should display the details of the bucket', function(){
    helpers.get_list_element(testBucket.name).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rgw/buckets/details');
    cephRgwCommons.bucketDetailAttributes.forEach(function(attr){
      expect(element(by.cssContainingText('dt', attr + ':')).isDisplayed()).toBe(true);
    });
  });

  it('should change owner (owner=tuxdoe)', function(){
    editBucket(testBucket.name);
    element(by.model('bucket.owner')).sendKeys(testBucket.owner);
    cephRgwCommons.submitBtn.click();
  });

  it('should display the new bucket owner', function(){
    var cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual(testUser.user_id);
  });

  it('should delete the test bucket', function(){
    element(by.cssContainingText('tr', testBucket.name)).click();
    helpers.delete_selection(0, '$ctrl');
  });

  it('should delete the test user', function(){
    element(by.css('.tc_menuitem_ceph_rgw')).click();
    element(by.css('.tc_submenuitem_ceph_rgw_users')).click();
    element(by.cssContainingText('tr', testUser.user_id)).click();
    helpers.delete_selection(0, '$ctrl');
  });

  afterAll(function(){
    console.log('ceph_rgw -> ceph_rgw_users.e2e.js');
  });
});
