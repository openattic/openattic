# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
    HyperlinkedRelatedField as RestFramework_HyperlinkedRelatedField,  \
    HyperlinkedIdentityField as RestFramework_HyperlinkedIdentityField

from rest.utilities import drf_version

if drf_version() < (3, 0):

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
else:
    class HyperlinkedRelatedField(RestFramework_HyperlinkedRelatedField):
        """
        There is a problem, if
        1. You are using DRF >= 3.0
        1. and your serializer contains a HyperlinkedRelatedField named f
        2. and the corresponding model does not have a related field f.
        3. Instead, it has a property f returning an F-model instance, e.g.:

        >>> class M(Model):
        >>>     @property
        >>>     def my_prop(self):
        >>>         return self.foo.my_prop

        Then, the serializer will fail to generate the URL, because the HyperlinkedRelatedField
        cannot cope with the fact that `django.db.models.base.Model#serializable_value`
        returns the PK, if the model returns a field with that name, or else the model instance.

        If we disable the pk-only-optimization, `HyperlinkedRelatedField` will not call
        `django.db.models.base.Model#serializable_value`, thus disabling the ode path affected
        by this bug.

        Another idea would be to force the use of the PK for these property based
        HyperlinkedRelatedFields by specifying the sorce attribute of the HyperlinkedRelatedField.
        But that doesn't work, cause some serializers must support properties and ForeinKeys at
        the same time.

        Feel free to find and implement another workaround.

        See also: https://github.com/tomchristie/django-rest-framework/issues/4653
        """

        def use_pk_only_optimization(self):
            return False

        def to_representation(self, obj):
            """
            We actually modify the output of `HyperlinkedRelatedField` to be non-standard.
            This should have been done in a different class, and not directly here.
            """
            url = super(HyperlinkedRelatedField, self).to_representation(obj)
            return {
                'id':    obj.pk,
                'url':   url,
                'title': unicode(obj)
            }

        def to_internal_value(self, value):
            """
            We actually modify the output of `HyperlinkedRelatedField` to be non-standard.
            This should have been done in a different class, and not directly here.
            """
            if type(value) != dict:
                raise TypeError("value needs to be a dictionary")
            if "id" in value:
                return self.queryset.get(id=value["id"])
            if "url" in value:
                return super(HyperlinkedRelatedField, self).to_internal_value(value["url"])
            raise KeyError("need id or url field (id preferred)")

    class HyperlinkedIdentityField(RestFramework_HyperlinkedIdentityField):
        def to_representation(self, obj):
            """
            We actually modify the output of `HyperlinkedIdentityField` to be non-standard.
            This should have been done in a class with a different name or not at all.
            """
            url = super(HyperlinkedIdentityField, self).to_representation(obj)
            return {
                'url': url
            }
