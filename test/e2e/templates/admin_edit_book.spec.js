"use strict";

describe("E2E: book creation view", function () {
    var exampleBook = {
        title       : 'JavaScript effektiv',
        subtitle    : '68 Dinge, die ein guter JavaScript-Entwickler wissen sollte',
        isbn        : '978-3-86490-127-0',
        abstract    : 'Wollen Sie JavaScript wirklich beherrschen?',
        numPages    : 240,
        author      : 'David Herman',
        publisher   : {
            name: 'dpunkt.verlag',
            url : 'http://dpunkt.de/'
        }
    };

    beforeEach(function () {
        browser().navigateTo('/#/admin/reset');
        browser().navigateTo('/#/admin/books/new');
        browser().reload();
        enterExampleBook('button.bm-submit-btn');
    });

    var selector = 'table.bm-book-list tr';

    it('should navigate to admin list view containing the edited book entry', function () {
        element(selector + ' a.bm-edit-link').query(function (editLinks, done) {
            for (var i = 0, n = editLinks.length; i < n; i++) {
                if (angular.element(editLinks[i]).text() === exampleBook.title) {
                    executeAndCheck(i);
                    break;
                }
            }

            done();
        });
    });

    var executeAndCheck = function(editLinkIndex) {
        // specify selector for the edit link
        var editLink = selector + ':nth-child('+ (editLinkIndex+1) +') a.bm-edit-link';

        // click on edit link
        element(editLink).click();

        // in edit form enter 'TEST' into book title field
        input('book.title').enter('TEST');

        // click on submit button
        element('button.bm-submit-btn').click();

        // admin list view should show up
        expect(
            browser().location().path()
        ).toEqual('/admin/books');

        // there should be a 'TEST' entry
        expect(
            repeater(selector).column('book.title')
        ).toContain('TEST');

        // list shouldn't contain entry with old title
        expect(
            repeater(selector).column('book.title')
        ).not().toContain(exampleBook.title);
    };

    var enterExampleBook = function(clickSelector) {
        input('book.title').enter(exampleBook.title);
        input('book.subtitle').enter(exampleBook.subtitle);
        input('book.isbn').enter(exampleBook.isbn);
        input('book.abstract').enter(exampleBook.abstract);
        input('book.numPages').enter(exampleBook.numPages);
        input('book.author').enter(exampleBook.author);
        input('book.publisher.name').enter(exampleBook.publisher.name);
        input('book.publisher.url').enter(exampleBook.publisher.url);

        element(clickSelector).click();
    };
});
