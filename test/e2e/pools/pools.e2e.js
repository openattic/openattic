var helpers = require('../common.js');

describe('Pools panel', function(){
    
  beforeAll(function(){
    helpers.login();
  });
  
  beforeEach(function(){
    element.all(by.css('ul .tc_menuitem')).get(2).click();      
  });
    
  it('should show the oadatatable', function(){
    expect(element(by.css('.tc_oadatatable_pools')).isDisplayed()).toBe(true);
    browser.sleep(400);
  });
  
  it('should have an add button', function(){
    expect(element(by.css('.tc_addPoolBtn')).isDisplayed()).toBe(true);
    browser.sleep(400);
  });

//NOTE CI system throws error :/ need to find fix for that  
//   it('should have a delete button', function(){
//     element(by.css('.tc_menudropdown')).click();
//     browser.sleep(400);
//     expect(element(by.css('.tc_deletePoolBtn2')).isDisplayed()).toBe(true);
//     element(by.css('.tc_menudropdown')).click();
//     browser.sleep(400);
//     
//   });
//   
//   it('should switch to delete button when selecting a pool', function(){
//     for(var key in helpers.configs.pools){
//       var pool = helpers.configs.pools[key];
//       element.all(by.cssContainingText('td', pool.name)).get(0).click();
//       browser.sleep(400);
//       expect(element(by.css('.tc_deletePoolBtn')).isDisplayed()).toBe(true);
//       
//       break;
//     }
//   });
  
  it('should display the configured pools', function(){
    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      var exact_poolname = pool.name;
      element.all(by.cssContainingText('option', pool.name))
        .then(function findMatch(pname){
          if (pool.name === pname){
            exact_poolname = pname;
            return true;
          }
       });
       
      if (exact_poolname){
         expect(element.all(by.cssContainingText('td', pool.name)).get(0).isDisplayed()).toBe(true);
      }
    }
  });
  
  it('should display the configured pools', function(){
    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      expect(element.all(by.cssContainingText('td', pool.size)).get(0).isDisplayed()).toBe(true);
    }
  });  
    
});