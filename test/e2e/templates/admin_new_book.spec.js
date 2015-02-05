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
    });

    var selector = 'table.bm-book-list tr';

    it('should navigate to admin list view having one more book entry', function () {
        enterExampleBook('button.bm-submit-btn');

        expect(
            browser().location().path()
        ).toEqual('/admin/books');

        expect(
            repeater(selector).column('book.title')
        ).toContain(exampleBook.title);
    });

    it('should navigate to admin list view without having one more book entry', function () {
        enterExampleBook('button.bm-cancel-btn');

        expect(
            browser().location().path()
        ).toEqual('/admin/books');

        expect(
            repeater(selector).column('book.title')
        ).not().toContain(exampleBook.title);
    });

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
