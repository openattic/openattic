# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

class BaseHandlerMeta(type):
    handlers = {}

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if 'model' in attrs:
            BaseHandlerMeta.handlers[attrs['model']] = cls

class BaseHandler(object):
    __metaclass__ = BaseHandlerMeta

    exclude = None
    fields  = None

    @classmethod
    def get_handler_for_model(cls, model):
        return cls.__metaclass__.handlers[model]

    def ids(self):
        """ Get a list of all existing object IDs. """
        return [o.id for o in self.model.objects.all()]

    def _idobj(self, obj):
        return {'id': obj.id}

    def get(self, id):
        return self._getobj( self.model.objects.get(id=id) )

    def _getobj(self, obj):
        data = {}
        for field in obj._meta.fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, models.ForeignKey ):
                if value is not None:
                    try:
                        handler = BaseHandler.get_handler_for_model(value.__class__)()
                    except KeyError:
                        data[field.name] = unicode(value)
                    else:
                        data[field.name] = handler._idobj(value)
            else:
                data[field.name] = value

        return self._override_get(obj, data)


    def set(self, id, data):
        return self._setobj( self.model.objects.get(id=id), data )

    def _setobj(self, obj, data):
        for field in obj._meta.fields:
            if field.name in data:
                setattr(obj, field.name, data[field.name])
        self._override_set(obj, data)
        return obj.save()


    def _override_get(self, obj, data):
        return data

    def _override_set(self, obj, data):
        return
