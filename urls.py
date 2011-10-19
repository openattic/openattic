# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

from django.contrib import admin
admin.autodiscover()

from django.conf import settings

from rpcd.extdirect import PROVIDER

js_info_dict = { "packages": ("lvm",) }

urlpatterns = [
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    (r'^accounts/login/$',  'django.contrib.auth.views.login' ),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': settings.PROJECT_URL+"/"}),

    (r'^direct/', include(PROVIDER.urls)),
    (r'^userprefs/',   include("userprefs.urls")),

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

    #(r'^lvm/',    include("lvm.urls")),
    #(r'^stats/',  include("hoststats.urls")),
    #(r'^nagios/', include("nagios.urls")),
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
