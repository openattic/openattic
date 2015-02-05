"use strict";

describe("E2E: book details view", function() {

    beforeEach(function() {
        browser().navigateTo('/');
    });

    it('should show the correct book details', function() {
        browser().navigateTo('#/books/978-3-89864-728-1');

        expect(element('.bm-book-title').html()).toBe(
            'JavaScript für Enterprise-Entwickler'
        );
        expect(element('.bm-book-subtitle').html()).toBe(
            'Professionell programmieren im Browser und auf dem Server'
        );
        expect(element('.bm-book-isbn').html()).toBe(
            'ISBN: 978-3-89864-728-1'
        );
        expect(element('.bm-book-num-pages').html()).toBe(
            'Seiten: 302'
        );
        expect(element('.bm-book-author').html()).toBe(
            'Autor: Oliver Ochs'
        );
        expect(element('.bm-book-publisher-name').html()).toBe(
            'dpunkt.verlag'
        );
        expect(element('.bm-book-publisher-name').attr('href')).toBe(
            'http://dpunkt.de/'
        );
        expect(element('.bm-book-abstract').html()).toBe(
            'JavaScript ist längst nicht mehr nur für' +
                ' klassische Webprogrammierer interessant.'
        );
    });

    it('should appropriately navigate to list view', function() {
        browser().navigateTo('#/books/978-3-89864-728-1');

        element('.bm-list-view-btn').click();

        expect(
            browser().location().path()
        ).toEqual('/books');
    });

});