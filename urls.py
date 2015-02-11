# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

from django.conf.urls            import url, patterns, include
from django.views.generic        import TemplateView

from django.contrib import admin
admin.autodiscover()

from django.conf import settings

from rpcd.extdirect import PROVIDER
from rest.router import ROUTER

from views import AuthView

def _get_openattic_apps():
    from os.path import commonprefix
    from django.conf import settings
    for name in settings.INSTALLED_APPS:
        try:
            module = __import__(name)
            if commonprefix((settings.PROJECT_ROOT, getattr(module, '__file__'))) == settings.PROJECT_ROOT:
                yield name
        except ImportError, err:
            pass

js_info_dict = { "packages": list(_get_openattic_apps()) }

urlpatterns = [
    (r'^api/auth$', AuthView.as_view(), {}, 'authenticate'),

    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    (r'^accounts/login/$',  'django.contrib.auth.views.login' ),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': settings.PROJECT_URL+"/"}),

    (r'^api/',      include(ROUTER.urls)),
    (r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    (r'^direct/', include(PROVIDER.urls)),
    (r'^userprefs/',   include("userprefs.urls")),

    (r'^accounts/logout.js$',    'views.do_logout', {}, 'logout' ),
    (r'^accounts/login.js$',     'views.do_login',  {}, 'login'  ),

    # we need a second URL for the do_login view which can be configured using an Apache
    # <Location> directive to authenticate using Kerberos
    (r'^accounts/kerblogin.js$', 'views.do_login',  {}, 'kerblogin' ),

    (r'^index.html$', 'views.index', {}, 'index'),

    (r'^js/(?P<app>\w+)/(?P<file>\w+)\.js$',
        lambda request, app, file: TemplateView.as_view(template_name="%s/%s.js" % (app, file), content_type="text/javascript")(request),
        {},
        'javascript'
    ),
    (r'^js/(?P<file>\w+)\.js$',
        lambda request, file: TemplateView.as_view(template_name="%s.js" % file, content_type="text/javascript")(request),
        {},
        'javascript_main'
    ),

    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    (r'^/?$', 'views.index', {}, '__main__' ),
]

for app in settings.INSTALLED_MODULES:
    try:
        module = __import__(app + ".urls")
    except ImportError:
        pass
    else:
        if hasattr(module.urls, "urlpatterns"):
            urlpatterns.append( ('^%s/' % app, include(app + ".urls")) )


if settings.DEBUG or True:
    urlpatterns.append(
        (r'^%s(?P<path>.*)$' % settings.MEDIA_URL[1:],
        'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT, 'show_indexes': True} ),
    )

if "rosetta" in settings.INSTALLED_APPS:
    urlpatterns.append( ( r'rosetta/', include( 'rosetta.urls' ) ) )

urlpatterns = patterns('', *urlpatterns)