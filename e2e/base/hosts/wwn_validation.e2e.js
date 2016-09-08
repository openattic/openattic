'use strict';
var helpers = require('../../common.js');

describe('Should add a host and attributes', function(){
  var invalidWwns = {
    iqn: [
      'iqn',
      'iqn.3016-06.org.openattic:storage:disk.sn-a8675309',
      'iqn.2016-16.org.openattic:storage:disk.sn-a8675309',
      'iqn.06-2016.org.openattic:storage:disk.sn-a8675309',
      'iqn.2016-06.openattic:storage:disk.sn-a8675309',
      'iqn.2016-06.25.openattic:storage:disk.sn-a8675309',
      'iqn.2016-06.org:storage:disk.sn-a8675309',
      'iqn.2016-06.org.opena#ttic:storage:disk.sn-a8675309',
      'iqn.2016-06.org.openattic:stor#age:disk.sn-a8675309'
    ],
    eui: [
      'eui',
      'eui,1234567890abcdef',
      'eui.123456g890abcdef',
      'eui.1234567890abcdef1',
      'eui.1234567890abcdf',
      'eui.eui.82393982823938',
      'eui1234567890abcdef'
    ],
    naa: [
      'naa',
      'naa,1234567890abcdef',
      'naa.123456g890abcdef',
      'naa.1234567890abcdef1',
      'naa.1234567890abcdf',
      'naa.naa.82393982823938',
      'naa1234567890abcdef',
      'naa,1234567890abcde1234567890abcdeff',
      'naa.123456g890abcdef1234567890abcdef',
      'naa.1234567890abcdef11234567890abcdef',
      'naa.1234567890abc1234567890abcdefdf',
      'naa.naa.823939821234567890abcdef823938',
      'naa12345678901234567890abcdefabcdef'
    ],
    mac: [
      'fee',
      'abcdefg',
      '12345600890abcdef',
      '1234567;890abcdef',
      '1234g60890abcdef',
      '123456890abcdef',
      ':123456890abcdef',
      '123:::67890abcdef',
      '11234567890abcdef234567890abcdef'
    ],
    all: [
      'all',
      'help',
      '???'
    ]
  };
  var validWwns = {
    iqn: ['' +
    'iqn.2016-06.org.openattic:storage:disk.sn-a8675309',
      'iqn.2016-12.org.openattic:storage:disk.sn-a8675309',
      'iqn.2096-12.org.openattic:storage:disk.sn-a8675309',
      'iqn.1996-12.org.openattic:storage:disk.sn-a8675309',
      'iqn.1996-12.org.openattic:storage:disk.sn-a8675309',
      'iqn.1996-12.com.it-novum.pastebin',
      'iqn.1996-12.com.it-novum.pastebin:store:disk:hdd:sn-2939'
    ],
    eui: [
      'eui.1234567890abcdef',
      'eui.1234567890ABCDEF',
      'eui.1234567890abcDEF'
    ],
    naa: [
      'naa.1234567890abcdef',
      'naa.1234567890ABCDEF',
      'naa.1234567890abcDEF',
      'naa.12345671234567890abcdef890abcdef',
      'naa.121234567890abcdef34567890ABCDEF',
      'naa.11234567890abcDEF234567890abcDEF'
    ],
    mac: [
      '1234567890abcdef',
      '1284:56:78:90:ab:cd:ef',
      '12:3486C8:90:ab:cd:ef',
      '12:3B568890:ab:cd:ef',
      '12a4567890:ab:cd:ef',
      '12:3F:56:78:90:ab:cd:ef',
      ':::::::::::::::12:FF:567890ab:cd:ef',
      ':12FF:567890:ab:cd:bf:::::::::::::::'
    ]
  };

  var errorMessages = {
    iqn: 'An IQN has the following notation \'iqn.$year-$month.$reversedAddress:$definedName\'\n' +
    'For example: iqn.2016-06.org.openattic:storage:disk.sn-a8675309\n' +
    'More information',
    eui: 'The Extended Unique Identifier (EUI) looks like this \'eui-${64bit hexadecimal number}\'.\n' +
    'For example: eui.1234567890abcdef\n' +
    'More information',
    naa: 'The T11 Network Address Authority (NAA) looks like this \'eui-${64bit or 128bit hexadecimal number}\'\n' +
    'For example: naa.1234567890abcdef or naa.1234567890abcdef1234567890abcdef\n' +
    'More information',
    mac: 'A MAC is a 64bit long hexadecimal number this means it is 16 characters long. ' +
    'You can just type the number and it will be LIO formatted for you or you can type it LIO formatted.\n' +
    'For example: 1234567890abcdef equal to 12:34:56:78:90:ab:cd:ef\n' +
    'More information',
    all: [
      'You can use the following formats:\n' +
      'IQN: iqn.$year-$month.$reversedAddress:$definedName\n' +
      'MAC: 16 characters long hexadecimal number\n' +
      'EUI: eui.${16 characters long hexadecimal number}\n' +
      'NAA: naa.${16 or 32 characters long hexadecimal number}',
      'You can use the following formats:\n\n' +
      'MAC: 16 characters long hexadecimal number\n' +
      'EUI: eui.${16 characters long hexadecimal number}\n' +
      'NAA: naa.${16 or 32 characters long hexadecimal number}'
    ]
  };

  var sendTag = function(wwn, field){
    element.all(by.model('data[key]')).get(field).click();
    element.all(by.model('newTag.text')).get(field).sendKeys(wwn);
    element(by.model('host.name')).click();
  };

  var clearField = function(field){
    element.all(by.model('data[key]')).get(field).click();
    element.all(by.model('newTag.text')).get(field).clear();
    expect(element.all(by.className('tc_wwn_invalid')).get(field).isDisplayed()).toBe(false);
  };

  var tryInvalid = function(key, field){
    invalidWwns[key].forEach(function(wwn){
      it('should show an error message when trying to add the following tag: "' + wwn + '" as "' + key +
          '" into tag field "' + field + '"', function(){
        sendTag(wwn, field);
        expect(element.all(by.className('tc_wwn_invalid')).get(field).isDisplayed()).toBe(true);
        expect(element.all(by.className('tc_err_' + key)).get(field).isDisplayed()).toBe(true);
        clearField(field);
      });
    })
  };

  var tryValid = function(key, field){
    validWwns[key].forEach(function(wwn){
      it('should successfully add a valid tag in a defined format: "' + wwn + '" as "' + key + '" into tag field "'
          + field + "'", function(){
        sendTag(wwn, field);
        expect(element.all(by.className('tc_wwn_invalid')).get(field).isDisplayed()).toBe(false);
        if(key === "mac"){
          wwn = wwn.replace(/:/g, "").match(/.{2}/g).join(":");
        }
        expect(element(by.binding('$getDisplayText()')).getInnerHtml()).toBe(wwn);
        element.all(by.model('data[key]')).get(field).click();
        element.all(by.model('newTag.text')).get(field).sendKeys('\b\b');
        //element(by.binding('::$$removeTagSymbol')).click();
        clearField(field);
      });
    })
  };

  var info = function(key, field){
    it('should show the correct error message for: "' + key + '" typing "' + invalidWwns[key][0] + '" into tag field "'
        + field + '"', function(){
      sendTag(invalidWwns[key][0], field);
      expect(element.all(by.className('tc_wwn_invalid')).get(field).isDisplayed()).toBe(true);
      var error = element.all(by.className('tc_err_' + key)).get(field);
      expect(error.isDisplayed()).toBe(true);
      if(key === 'all'){
        expect(error.getText()).toBe(errorMessages[key][field]);
      }else{
        expect(error.getText()).toBe(errorMessages[key]);
      }
      clearField(field);
    });
  };

  beforeAll(function(){
    helpers.login();
    element(by.css('ul .tc_menuitem_hosts > a')).click();
    element(by.css('.tc_addHost')).click();
    var checkboxes = element.all(by.model('type.check'));
    checkboxes.get(0).click();
    checkboxes.get(1).click();
    browser.sleep(400);
  });

  Object.keys(invalidWwns).forEach(function(key){
    info(key, 0);
    tryInvalid(key, 0);
    if (key !== 'all'){
      tryValid(key, 0);
    }
    if (key !== 'iqn'){
      info(key, 1);
      tryInvalid(key, 1);
      if (key !== 'all'){
        tryValid(key, 1);
      }
    }
    it('Should have finished all tests regarding ' + key, function(){
      console.log('host -> wwn_validation.e2e.js -> ' + key);
    });
  });

  afterAll(function(){
    console.log('hosts -> wwn_validation.e2e.js');
  });
});
