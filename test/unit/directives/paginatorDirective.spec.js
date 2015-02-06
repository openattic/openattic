describe('A paginatorDirective', function () {

  var $rootScope, $compile;
  beforeEach(module('openattic.datatable'));
  beforeEach(module('templates'));

  beforeEach(inject(function (_$rootScope_,_$compile_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  it('should contain at least two buttons', function () {

    var html = "<paginator></paginator>";
    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(element.find('.paginate_button').length).toBeGreaterThan(1);


  });

  it('should contain a previous button', function () {

    var html = "<paginator></paginator>";
    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(element.find('.paginate_button.previous').length).toBe(1);


  });

  it('should contain a next button', function () {

    var html = "<paginator></paginator>";
    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(element.find('.paginate_button.next').length).toBe(1);

  });

  it('should display 1,2,3 on [1,2,3] data', function(){

    var html = '<paginator page="pageData" pages="pagesData"></paginator>';

    $rootScope.pageData = 0;
    $rootScope.pagesData = 3;

    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('2');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('3');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('Next');

  });

  it('should display 1..10 correct< on [1..10] data', function(){

    var html = '<paginator page="pageData" pages="pagesData"></paginator>';

    $rootScope.pageData = 0;
    $rootScope.pagesData = 10;

    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('2');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('3');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('4');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('5');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');

  });


  it('should go to page 5 if page 5 button is clicked', function(){

    var html = '<paginator page="pageData" pages="pagesData"></paginator>';

    $rootScope.pageData = 0;
    $rootScope.pagesData = 10;

    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('2');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('3');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('4');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('5');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


    angular.element(element.find('.paginate_button')[5]).click();
    $rootScope.$apply();


    expect($rootScope.pageData).toBe(4);

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('4');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('5');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('6');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


  });


  it('should do nothing on prev when already on the first page', function(){

    var html = '<paginator page="pageData" pages="pagesData"></paginator>';

    $rootScope.pageData = 0;
    $rootScope.pagesData = 10;

    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('2');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('3');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('4');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('5');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


    angular.element(element.find('.paginate_button')[0]).click();
    $rootScope.$apply();


    expect($rootScope.pageData).toBe(0);

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('2');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('3');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('4');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('5');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


  });


  it('should do nothing on next when already on the last page', function(){

    var html = '<paginator page="pageData" pages="pagesData"></paginator>';

    $rootScope.pageData = 9;
    $rootScope.pagesData = 10;

    var element = $compile(html)($rootScope);
    $rootScope.$apply();

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('6');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('7');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('8');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('9');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


    angular.element(element.find('.paginate_button')[8]).click();
    $rootScope.$apply();


    expect($rootScope.pageData).toBe(9);

    expect(angular.element(element.find('.paginate_button')[0]).text()).toMatch('Previous');
    expect(angular.element(element.find('.paginate_button')[1]).text()).toMatch('1');
    expect(angular.element(element.find('.paginate_button')[2]).text()).toMatch('…');
    expect(angular.element(element.find('.paginate_button')[3]).text()).toMatch('6');
    expect(angular.element(element.find('.paginate_button')[4]).text()).toMatch('7');
    expect(angular.element(element.find('.paginate_button')[5]).text()).toMatch('8');
    expect(angular.element(element.find('.paginate_button')[6]).text()).toMatch('9');
    expect(angular.element(element.find('.paginate_button')[7]).text()).toMatch('10');
    expect(angular.element(element.find('.paginate_button')[8]).text()).toMatch('Next');


  });

});