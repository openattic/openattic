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

from rest_framework.relations import \
    HyperlinkedRelatedField  as RestFramework_HyperlinkedRelatedField,  \
    HyperlinkedIdentityField as RestFramework_HyperlinkedIdentityField

class HyperlinkedRelatedField(RestFramework_HyperlinkedRelatedField):
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
