'use strict';

describe('Directive: tokenfield', function () {

    // just to match the baseUrl in the BookDataService
    var baseUrl = 'http://localhost:4730';

    var $compile,
        $rootScope,
        $httpBackend,
        element,
        scope;

    var testTags = ['test1', 'test2', 'test3'];

    // load the application module
    beforeEach(module('bmApp'));

    // get a reference to all used services
    beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
        $compile    = _$compile_;
        $rootScope  = _$rootScope_;
        $httpBackend= _$httpBackend_;
    }));

    // define trained responses
    beforeEach(function() {
        $httpBackend.when('GET', baseUrl + '/api/tags').respond(
            testTags
        );
    });

    // actual init logic
    beforeEach(function() {
        scope = $rootScope.$new();

        scope.book = {
            tags: angular.copy(testTags)
        };

        element = $compile('<input tokenfield="book">')(scope);
        $httpBackend.flush();
    });

    it('should properly create available tokens on initialization', function () {
        var tokens = element.parent().find('div.token');

        expect(tokens.length).toBe(testTags.length);

        tokens.each(function(index, token) {
            expect(angular.element(token).data('value')).toEqual(testTags[index]);
        });
    });

    it('should properly add new tokens', function () {
        var tokenCount = element.parent().find('div.token').length,
            tokenInput = element.parent().find('input.token-input'),
            testToken = 'test4';

        tokenInput.focus();
        tokenInput.val(testToken);
        tokenInput.blur();

        var tokenCountAfter = element.parent().find('div.token').length;
        expect(tokenCountAfter).toBe(tokenCount + 1);
        expect(scope.book.tags.length).toBe(tokenCountAfter);
        expect(element.parent().html()).toContain(testToken);
    });

    it('should properly remove new tokens', function () {
        var indexToRemove = 0;

        angular.element(
            element.parent().find('div.token')[indexToRemove]
        ).find('a.close').click();

        expect(element.parent().find('div.token').length).toBe(testTags.length - 1);
        expect(scope.book.tags.length).toBe(testTags.length - 1);
        expect(element.parent().html()).not.toContain(testTags[indexToRemove]);
    });
});
