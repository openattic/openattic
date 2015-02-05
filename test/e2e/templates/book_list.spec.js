"use strict";

describe("E2E: book list view", function () {

    // Define the array of books in the expected order.
    // Sorted by title.
    var expectedBooks = [
        {
            title: 'CoffeeScript',
            isbn: '978-3-86490-050-1',
            author: 'Andreas Schubert'
        },
        {
            title: 'JavaScript für Enterprise-Entwickler',
            isbn: '978-3-89864-728-1',
            author: 'Oliver Ochs'
        },
        {
            title: 'Node.js & Co.',
            isbn: '978-3-89864-829-5',
            author: 'Golo Roden'
        }
    ];

    // Derive an array that only contains titles
    // for easier expectation checks.
    var orderedTitles = expectedBooks.map(function(book) {
        return book.title;
    });

    beforeEach(function () {
        browser().navigateTo('/#/admin/reset');
        browser().navigateTo('#/books');
        browser().reload();
    });

    var selector = 'table.bm-book-list tr';

    it('should show the correct number of books', function () {
        expect(repeater(selector).count()).toEqual(expectedBooks.length);
    });

    it('should show the books in the proper order', function() {
        // Are they in the expected order (ascending sorted by title)?
        expect(repeater(selector).column('book.title')).toEqual(orderedTitles);
    });

    it('should show the correct book information', function() {
        // Do the other book details (isbn, author) match?
        for (var i = 0, n = expectedBooks.length; i < n; i++) {
            expect(repeater(selector).row(i))
                .toEqual(
                    [
                        expectedBooks[i].title,
                        expectedBooks[i].author,
                        expectedBooks[i].isbn
                    ]
                );
        }
    });

    it('should allow filtering by book title', function() {
        // Coffee
        var searchText = orderedTitles[0].substr(0, 6);
        input('searchText').enter(searchText);
        expect(
            repeater(selector).column('book.title')
        ).toEqual([orderedTitles[0]]);
    });

    it('should allow filtering by author', function() {
        // Andreas
        var searchText = expectedBooks[0].author.substr(0, 7);
        input('searchText').enter(searchText);
        expect(
            repeater(selector).column('book.title')
        ).toEqual([orderedTitles[0]]);
    });

    it('should allow filtering by isbn', function() {
        // 050-1
        var searchText = expectedBooks[0].isbn.substr(-5, 5);
        input('searchText').enter(searchText);
        expect(
            repeater(selector).column('book.title')
        ).toEqual([orderedTitles[0]]);
    });

    it('should appropriately navigate to details view', function() {
        var i = 0,
            detailsLink = selector + ':nth-child('+ (i+1) +') a.bm-details-link';
        element(detailsLink).click();

        expect(
            browser().location().path()
        ).toEqual('/books/' + expectedBooks[i].isbn);
    });

});