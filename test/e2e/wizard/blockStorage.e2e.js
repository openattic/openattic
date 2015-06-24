var helpers = require('../common.js');
var configs = require('../configs.js');

describe('Raw Block Storage Wizard', function(){
    
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  
  beforeAll(function(){
    helpers.login();  
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');    
  });  
  
  //<-- Raw Block Storage Wizard --->
  it ('should have a button "Raw Block Storage"; navigate through the wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[2].element(by.className('btn-block'));
      expect(fs_wizard.isDisplayed()).toBe(true);
      fs_wizard.click();
      
      //first site
      
      //check available buttons
      expect(wizardOverviewBtn.isDisplayed()).toBe(true);
      expect(previousBtn.isDisplayed()).toBe(true);
    });
    //check if angular expression contains 'Next' or 'Done
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');      
  });    
    
});

