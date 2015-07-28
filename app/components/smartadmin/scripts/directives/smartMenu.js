(function ($) {

    $.fn.smartCollapseToggle = function () {

        return this.each(function () {

            var $body = $('body');
            var $this = $(this);

            // only if not  'menu-on-top'
            if ($body.hasClass('menu-on-top')) {


            } else {

                $body.hasClass('mobile-view-activated')

                // toggle open
                $this.toggleClass('open');

                // for minified menu collapse only second level
                if ($body.hasClass('minified')) {
                    if ($this.closest('nav ul ul').length) {
                        $this.find('>a .collapse-sign .fa').toggleClass('fa-minus-square-o fa-plus-square-o');
                        $this.find('ul:first').slideToggle(200);
                    }
                } else {
                    // toggle expand item
                    $this.find('>a .collapse-sign .fa').toggleClass('fa-minus-square-o fa-plus-square-o');
                    $this.find('ul:first').slideToggle(200);
                }
            }
        });
    };
})(jQuery);

angular.module('smartadmin.smartmenu')
.directive('smartMenu', function ($state, $rootScope) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var $body = $('body');

            var $collapsible = element.find('li[data-menu-collapse]');
            $collapsible.each(function (idx, li) {
                var $li = $(li);
                $li
                    .on('click', '>a', function (e) {

                        // collapse all open siblings
                        $li.siblings('.open').smartCollapseToggle();

                        // toggle element
                        $li.smartCollapseToggle();

                        // add active marker to collapsed element if it has active childs
                        if (!$li.hasClass('open') && $li.find('li.active').length > 0) {
                            $li.addClass('active')
                        }

                        e.preventDefault();
                    })
                    .find('>a').append('<b class="collapse-sign"><em class="fa fa-plus-square-o"></em></b>');

                // initialization toggle
                if ($li.find('li.active').length) {
                    $li.smartCollapseToggle();
                    $li.find('li.active').parents('li').addClass('active');
                }
            });

            // click on route link
            element.on('click', 'a[data-ui-sref]', function (e) {
                // collapse all siblings to element parents and remove active markers
                $(this)
                    .parents('li').addClass('active')
                    .each(function () {
                        $(this).siblings('li.open').smartCollapseToggle();
                        $(this).siblings('li').removeClass('active')
                    });

                if ($body.hasClass('mobile-view-activated')) {
                    $rootScope.$broadcast('requestToggleMenu');
                }
            });


            scope.$on('$smartLayoutMenuOnTop', function (event, menuOnTop) {
                if (menuOnTop) {
                    $collapsible.filter('.open').smartCollapseToggle();
                }
            });

        }
    }
});
