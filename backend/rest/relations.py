# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

from rest_framework.relations import \
    HyperlinkedRelatedField  as RestFramework_HyperlinkedRelatedField,  \
    HyperlinkedIdentityField as RestFramework_HyperlinkedIdentityField

class HyperlinkedRelatedField(RestFramework_HyperlinkedRelatedField):
    def __init__(self, *args, **kwargs):
        # Work around a bug in Django Rest Framework that causes the
        # serializer context to not be passed down to us.
        #
        # https://github.com/tomchristie/django-rest-framework/issues/1237
        #
        # To fix this, we add a dummy request object that provides a
        # build_absolute_uri method which doesn't do anything. This does
        # not affect all cases where the context is set correctly because
        # it will be overwritten before being used.

        class DummyRequest(object):
            def build_absolute_uri(self, url):
                return url

        self.context = {
            "request": DummyRequest()
        }

        super(HyperlinkedRelatedField, self).__init__(*args, **kwargs)

    def to_native(self, obj):
        url = super(HyperlinkedRelatedField, self).to_native(obj)
        return {
            'id':    obj.pk,
            'url':   url,
            'title': unicode(obj)
        }

    def from_native(self, value):
        if type(value) != dict:
            raise TypeError("value needs to be a dictionary")
        if "id" in value:
            return self.queryset.get(id=value["id"])
        if "url" in value:
            return super(HyperlinkedRelatedField, self).from_native(value["url"])
        raise KeyError("need id or url field (id preferred)")

class HyperlinkedIdentityField(RestFramework_HyperlinkedIdentityField):
    def field_to_native(self, obj, field_name):
        url = super(HyperlinkedIdentityField, self).field_to_native(obj, field_name)
        return {
            'url': url
        }
