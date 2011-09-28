# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

from django.contrib import admin
admin.autodiscover()

from django.conf import settings

from rpcd.extdirect import PROVIDER

js_info_dict = { "packages": ("lvm",) }

urlpatterns = patterns('',
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    (r'^accounts/login/$',  'django.contrib.auth.views.login' ),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': settings.PROJECT_URL+"/"}),

    (r'^direct/', include(PROVIDER.urls)),
    (r'^userprefs/',   include("userprefs.urls")),

    (r'^lvm/',   include("lvm.urls")),
    (r'^stats/', include("hoststats.urls")),

    (r'^accounts/logout.js$',  'views.do_logout', {}, 'logout' ),
    (r'^accounts/login.js$',  'views.do_login', {}, 'login' ),
    (r'^index.html$', 'views.index', {}, 'index'),

    (r'^js/(?P<app>\w+)/(?P<file>\w+)\.js$',
        lambda request, app, file: direct_to_template(request, template="%s/%s.js" % (app, file), mimetype="text/javascript"),
        {},
        'javascript'
    ),

    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    (r'^/?$', 'views.index', {}, '__main__' ),
)


if settings.DEBUG or True:
    urlpatterns += patterns('',
        (r'^%s(?P<path>.*)$' % settings.MEDIA_URL[1:],
        'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT, 'show_indexes': True} ),
    )

if "rosetta" in settings.INSTALLED_APPS:
    urlpatterns += patterns( '',
        ( r'rosetta/', include( 'rosetta.urls' ) )
    )
