'use strict';

describe('Service: BookDataService', function () {

    // just to match the baseUrl in the service
    var baseUrl = 'http://localhost:4730';

    var BookDataService,
        $httpBackend;

    // load the application module
    beforeEach(module('bmApp'));

    // get a reference to all used services
    beforeEach(inject(function (_BookDataService_, _$httpBackend_) {
        BookDataService = _BookDataService_;
        $httpBackend = _$httpBackend_;
    }));

    // define trained responses
    beforeEach(function() {
        $httpBackend.when('GET', baseUrl + '/api/books').respond(
            testBooks
        );

        $httpBackend.when('GET', baseUrl + '/api/books/' + csBook.isbn).respond(
            csBook
        );

        $httpBackend.when('GET', baseUrl + '/api/books/test').respond(
            404,
            ''
        );

        $httpBackend.when('POST', baseUrl + '/api/books').respond(
            true
        );

        $httpBackend.when('PUT', baseUrl + '/api/books/' + csBook.isbn).respond(
            true
        );

        $httpBackend.when('DELETE', baseUrl + '/api/books/' + csBook.isbn).respond(
            true
        );
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Public API', function() {
        it('should include a getBookByIsbn() function', function () {
            expect(BookDataService.getBookByIsbn).toBeDefined();
        });

        it('should include a getBooks() function', function () {
            expect(BookDataService.getBooks).toBeDefined();
        });

        it('should include a storeBook() function', function () {
            expect(BookDataService.storeBook).toBeDefined();
        });

        it('should include a updateBook() function', function () {
            expect(BookDataService.updateBook).toBeDefined();
        });

        it('should include a deleteBookByIsbn() function', function () {
            expect(BookDataService.deleteBookByIsbn).toBeDefined();
        });
    });

    describe('Public API usage', function() {
        describe('getBookByIsbn()', function() {
            it('should return the proper book object', function() {
                $httpBackend.expectGET(baseUrl + '/api/books/' + csBook.isbn);

                var book;
                BookDataService.getBookByIsbn(csBook.isbn).then(function(res) {
                    book = res.data;
                });
                $httpBackend.flush();

                expect(book.title).toBe(csBook.title);
            });

            it('should return null (invalid isbn)', function() {
                $httpBackend.expectGET(baseUrl + '/api/books/test');
                var error;
                BookDataService.getBookByIsbn('test').then(function(res) {

                }, function(err) {
                    error = err;
                });
                $httpBackend.flush();

                expect(error).toBeDefined();
            });
        });

        describe('getBooks()', function() {
            it('should return a proper array of book objects', function() {
                $httpBackend.expectGET(baseUrl + '/api/books');

                var books;
                BookDataService.getBooks().then(function(res) {
                    books = res.data;
                });
                $httpBackend.flush();

                expect(books.length).toBe(testBooks.length);
            });
        });

        describe('storeBook()', function() {
            it('should properly store the passed book object', function() {
                $httpBackend.expectPOST(baseUrl + '/api/books', effectiveJsBook);
                BookDataService.storeBook(effectiveJsBook);
                $httpBackend.flush();
            });
        });

        describe('updateBook()', function() {
            it('should properly update the book object', function() {
                $httpBackend.expectPUT(baseUrl + '/api/books/' + csBook.isbn, csBook);
                BookDataService.updateBook(csBook);
                $httpBackend.flush();
            });
        });

        describe('deleteBookByIsbn()', function() {
            it('should properly delete the book object with the passed isbn', function() {
                $httpBackend.expectDELETE(baseUrl + '/api/books/' + csBook.isbn);
                BookDataService.deleteBookByIsbn(csBook.isbn);
                $httpBackend.flush();
            });
        });
    });

    // Helper objects
    var effectiveJsBook = {
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

    var csBook = {
        title: 'CoffeeScript',
        subtitle: 'Einfach JavaScript',
        isbn: '978-3-86490-050-1',
        abstract: 'CoffeeScript ist eine junge, kleine Programmiersprache, die nach JavaScript übersetzt wird.',
        numPages: 200,
        author: 'Andreas Schubert',
        publisher: {
            name: 'dpunkt.verlag',
            url: 'http://dpunkt.de/'
        },
        tags: [
            'coffeescript', 'web'
        ]
    };

    var testBooks = [
        {
            title: 'JavaScript für Enterprise-Entwickler',
            subtitle: 'Professionell programmieren im Browser und auf dem Server',
            isbn: '978-3-89864-728-1',
            abstract: 'JavaScript ist längst nicht mehr nur für klassische Webprogrammierer interessant.',
            numPages: 302,
            author: 'Oliver Ochs',
            publisher: {
                name: 'dpunkt.verlag',
                url: 'http://dpunkt.de/'
            },
            tags: [
                'javascript', 'enterprise', 'nodejs', 'web', 'browser'
            ]
        },
        {
            title: 'Node.js & Co.',
            subtitle: 'Skalierbare, hochperformante und echtzeitfähige Webanwendungen professionell in JavaScript entwickeln',
            isbn: '978-3-89864-829-5',
            abstract: 'Nach dem Webbrowser erobert JavaScript nun auch den Webserver.',
            numPages: 334,
            author: 'Golo Roden',
            publisher: {
                name: 'dpunkt.verlag',
                url: 'http://dpunkt.de/'
            },
            tags: [
                'javascript', 'nodejs', 'web', 'realtime', 'socketio'
            ]
        },
        csBook
    ];

});
