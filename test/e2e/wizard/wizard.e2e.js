var helpers = require('../common.js');

describe('Wizard panel', function(){
  
    
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  
  beforeAll(function(){
    helpers.login();  
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');    
  });
  
  it('should check the titles', function(){
    var wizards = element.all(by.repeater('wizard in wizards'))
      .then(function(wizards){
        var fsTitle = wizards[0].element(by.className('btn-block'));
        expect(fsTitle.getText()).toEqual('File Storage');
        var vmTitle = wizards[1].element(by.className('btn-block'));
        expect(vmTitle.getText()).toEqual('VM Storage');
        var blockTitle = wizards[2].element(by.className('btn-block'));
        expect(blockTitle.getText()).toEqual('Raw Block Storage');
      });    
  });   
  
  it('should a widget title', function(){
    expect(element.all(by.css('h2')).get(1).getText()).toEqual('openATTIC Wizards');
  });
  
  it('should have a button "File Storage" which navigates through this wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[0].element(by.className('btn-block'));
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
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('File Storage Step 1 - Create Volume');
      
  });
  
//   it('should have a button "VM Storage" which navigates through the wizard', function(){});
//   
//   it ('should have a button "Raw Block Storage" which navigates through the wizard', function(){});
    
});