# -*- coding: utf-8 -*-
from django.conf.urls.defaults import *

from django.contrib import admin
admin.autodiscover()

from django.conf import settings

urlpatterns = patterns('',
    (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^admin/', include(admin.site.urls)),

    (r'^lvm/',   include("lvm.urls")),
    (r'^nfs/',   include("nfs.urls")),
    (r'^iscsi/', include("iscsi.urls")),

    (r'^/?$', 'django.views.generic.simple.redirect_to', {'url': settings.PROJECT_URL + '/lvm/'} ),
)


if settings.DEBUG or True:
    urlpatterns += patterns('',
        (r'^%s(?P<path>.*)$' % settings.MEDIA_URL[1:],
        'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT, 'show_indexes': True} ),
    )
