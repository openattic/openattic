# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import *

from django.contrib import admin
admin.autodiscover()

from django.conf import settings

urlpatterns = patterns('',
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    (r'^accounts/login/$',  'django.contrib.auth.views.login' ),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout', {'next_page': settings.PROJECT_URL+"/"}),

    (r'^api/',   include("api.urls")),

    (r'^lvm/',   include("lvm.urls")),
    (r'^nfs/',   include("nfs.urls")),
    (r'^http/',  include("http.urls")),
    (r'^iscsi/', include("iscsi.urls")),
    (r'^samba/', include("samba.urls")),
    (r'^drbd/',  include("drbd.urls")),

    (r'^stats/', include("hoststats.urls")),

    (r'^dummy/status/$', 'django.views.generic.simple.direct_to_template', {'template': 'dummy_status.html'}, 'dummy_status'),
    (r'^dummy/performance/$', 'django.views.generic.simple.direct_to_template', {'template': 'dummy_performance.html'}, 'dummy_performance'),
    (r'^dummy/system/$', 'django.views.generic.simple.direct_to_template', {'template': 'dummy_system.html'}, 'dummy_system'),
    (r'^dummy/services/$', 'django.views.generic.simple.direct_to_template', {'template': 'dummy_services.html'}, 'dummy_services'),

    (r'^/?$', 'django.views.generic.simple.redirect_to', {'url': settings.PROJECT_URL + '/lvm/'}, '__main__' ),
)


if settings.DEBUG or True:
    urlpatterns += patterns('',
        (r'^%s(?P<path>.*)$' % settings.MEDIA_URL[1:],
        'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT, 'show_indexes': True} ),
    )
