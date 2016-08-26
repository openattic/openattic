var helpers = require('../../common.js');

describe('Pagination', function(){

  var systemItem = element(by.css('.tc_menuitem_system > a'));
  var cmdlogs = element(by.css('.tc_submenuitem_system_cmdlogs > a'));

  var firstPage = element(by.css('.pagination .first'));
  var prevPage = element(by.css('.pagination .prev'));
  var inputPage = element(by.css('.pagination.paginate-input > input'));
  var nextPage = element(by.css('.pagination .next'));
  var lastPage = element(by.css('.pagination .last'));

  var lastPageNumber = element(by.css('.pagination.paginate-input .paginate_of b'));

  var currentPage = function(){
    return inputPage.getAttribute('value');
  };

  var elementIsDisabled = function(e){
    return e.getAttribute('class').then(function (classes){
      return classes.split(' ').indexOf('disabled') !== -1;
    });
  };

  var switchPage = function(callback){
    var currentPage = element(by.css('tbody')).getOuterHtml();
    callback();
    var newPage = element(by.css('tbody')).getOuterHtml();
    expect(currentPage !== newPage).toBe(true);
  };

  beforeAll(function(){
    helpers.login();
    systemItem.click();
    cmdlogs.click();
    browser.sleep(400);
  });

  beforeEach(function(){
    browser.refresh();
  });

  it('should display all pagination elements', function(){
    expect(firstPage.isDisplayed()).toBe(true);
    expect(prevPage.isDisplayed()).toBe(true);
    expect(inputPage.isDisplayed()).toBe(true);
    expect(nextPage.isDisplayed()).toBe(true);
    expect(lastPage.isDisplayed()).toBe(true);
  });

  it('should start on page 1', function(){
    expect(currentPage()).toBe('1');
  });

  it('should show first page and previous page button as disabled on the first page', function(){
    expect(currentPage()).toBe('1');
    expect(elementIsDisabled(firstPage)).toBe(true);
    expect(elementIsDisabled(prevPage)).toBe(true);
  });

  it('should click the next page button and jump to page 2', function(){
    switchPage(function(){
      inputPage.sendKeys(protractor.Key.BACK_SPACE + '2');
    });
    expect(currentPage()).toBe('2');
  });

  it('should click the next page button and jump to page 2', function(){
    switchPage(function(){
      nextPage.element(by.tagName('span')).click();
    });
    expect(currentPage()).toBe('2');
  });

  it('should click the last page button and jump to page the last page', function(){
    switchPage(function(){
      lastPage.element(by.tagName('span')).click();
    });
    expect(currentPage()).toBe(lastPageNumber.getText());
  });

  it('should show last page and next page button as disabled on the last page', function(){
    switchPage(function(){
      lastPage.element(by.tagName('span')).click();
    });
    expect(currentPage()).toBe(lastPageNumber.getText());
    expect(elementIsDisabled(nextPage)).toBe(true);
    expect(elementIsDisabled(lastPage)).toBe(true);
  });

  it('should go to the next page than click the previous page button and jump to last page 1', function(){
    switchPage(function(){
      nextPage.element(by.tagName('span')).click();
    });
    expect(currentPage()).toBe('2');
    switchPage(function(){
      prevPage.element(by.tagName('span')).click();
    });
    expect(currentPage(), 10).toBe('1');
  });

  it('should go to the last page than click the first page button and jump to last page 1', function(){
    switchPage(function(){
      lastPage.element(by.tagName('span')).click();
    });
    expect(currentPage()).toBe(lastPageNumber.getText());
    switchPage(function(){
      firstPage.element(by.tagName('span')).click();
    });
    expect(currentPage(), 10).toBe('1');
  });

  it('should try to input a negative number resulting to still be on page 1', function(){
    inputPage.sendKeys(protractor.Key.BACK_SPACE + '-3282');
    expect(currentPage()).toBe('1');
  });

  it('should try to input text resulting to still be on page 1', function(){
    inputPage.sendKeys(protractor.Key.BACK_SPACE + 'lorem ipsum');
    expect(currentPage()).toBe('1');
  });

  it('should try to input a number much higher than the last page resulting to be on the last page', function(){
    switchPage(function(){
      inputPage.sendKeys(protractor.Key.BACK_SPACE + '9999999999999');
    });
    expect(currentPage()).toBe(lastPageNumber.getText());
  });

  it('should click in the input field an press key UP to jump to the next page', function(){
    switchPage(function(){
      inputPage.sendKeys(protractor.Key.ARROW_UP);
    });
    expect(currentPage()).toBe('2');
  });

  it('should go to page 2 and press key DOWN in the input field to jump back to page one', function(){
    switchPage(function(){
      inputPage.sendKeys(protractor.Key.ARROW_UP);
    });
    expect(currentPage()).toBe('2');
    switchPage(function(){
      inputPage.sendKeys(protractor.Key.ARROW_DOWN);
    });
    expect(currentPage()).toBe('1');
  });

  afterAll(function(){
    console.log('pagination -> pagination.e2e.js');
  });
});
