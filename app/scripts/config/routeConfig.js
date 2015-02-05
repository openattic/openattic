"use strict";

bmApp.config(function ($routeProvider) {
    $routeProvider.when('/books/:isbn', {
        //templateUrl: 'templates/book_details_with_expressions.html',
        templateUrl: 'templates/book_details.html',
        controller: 'BookDetailsCtrl'
    })
        .when('/books', {
            templateUrl: 'templates/book_list.html',
            controller: 'BookListCtrl'
        })

        /* Admin routes */
        .when('/admin/books', {
            // we reuse the template from the list view
            templateUrl: 'templates/book_list.html',
            controller: 'AdminBookListCtrl'
        })
        .when('/admin/books/new', {
            templateUrl: 'templates/admin/book_form.html',
            controller: 'AdminNewBookCtrl'
        })
        .when('/admin/books/:isbn/edit', {
            templateUrl: 'templates/admin/book_form.html',
            controller: 'AdminEditBookCtrl'
        })
        .when('/admin/books/:isbn/delete', {
            templateUrl: 'templates/admin/book_delete.html',
            controller: 'AdminDeleteBookCtrl'
        })

        /* Route to reset backend */
        .when('/admin/reset', {
            templateUrl: 'templates/admin/reset.html',
            controller: 'AdminResetCtrl'
        })

        /* Default route */
        .otherwise({
            redirectTo: '/books'
        });
});