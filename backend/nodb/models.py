from django.db import models
from django.db.models.query import QuerySet
from django.db.models.manager import BaseManager


class NodbQuerySet(QuerySet):

    def __init__(self, model, using=None, hints=None, request=None, context=None):
        self.model = model
        self._context = context
        self._current = 0
        self._data = None
        self._data = self.model.get_all_objects(self._context)
        self._max = len(self._data) - 1

    def __iter__(self):
        return self

    def next(self):
        if self._current > self._max:
            raise StopIteration
        else:
            self._current += 1
            return self._data[self._current - 1]

    def __getitem__(self, index):
        return self._data[index]

    def __getattribute__(self, attr_name):
        try:  # Just return own attributes.
            own_attr = super(NodbQuerySet, self).__getattribute__(attr_name)
        except AttributeError:
            pass
        else:
            return own_attr

        if attr_name in vars(self) or attr_name in vars(NodbQuerySet):
            attr = self.oInstance.__getattribute__(attr_name)
            return attr

        msg = 'Call to an attribute `{}` of {} which isn\'t intended to be accessed directly.'
        msg = msg.format(attr_name, NodbQuerySet)
        raise AttributeError(msg)

    def _clone(self):
        return NodbQuerySet(self.model)

    def count(self):
        return len(self._data)

    def get(self, **kwargs):
        """Return a single object filtered by kwargs."""
        filtered_data = self.filter(**kwargs)

        # Thankfully copied from
        # https://github.com/django/django/blob/1.7/django/db/models/query.py#L351
        num = len(filtered_data)
        if num == 1:
            return filtered_data[0]
        if not num:
            raise self.model.DoesNotExist(
                "%s matching query does not exist." %
                self.model._meta.object_name)
        raise self.model.MultipleObjectsReturned(
            "get() returned more than one %s -- it returned %s!" % (
                self.mode_._meta.object_name,
                num
            )
        )

    def filter(self, **kwargs):

        def _filter(obj):
            for key, value in kwargs.items():
                keys = key.split('__')

                attr = obj
                for i, k in enumerate(keys):
                    attr = getattr(attr, k)
                    is_model = isinstance(attr, models.Model)

                    if i == len(keys) - 1 and is_model:
                        # We're at the end of the iteration but we found an object
                        # instead of a comparable type.
                        msg = 'Attribute {} is an object'.format(k)
                        raise AttributeError(msg)

                    if not is_model and i < len(keys) - 1:
                        # We're still iterating keys but found a non object where we expected an
                        # object.
                        msg = 'Attribute {} is not an object'.format(k)
                        raise AttributeError(msg)

                    if is_model:
                        continue
                    elif attr == value:
                        return True
                    else:
                        return False

            return False

        return filter(_filter, self._data)

    def all(self, context):
        super(NodbQuerySet, self).all(context)


class NodbManager(BaseManager.from_queryset(NodbQuerySet)):

    use_for_related_fields = True

    def all(self, context=None):
        return self.get_queryset(context)

    def get_queryset(self, context=None):
        return self._queryset_class(self.model, using=self._db, hints=self._hints, context=context)


class NodbModel(models.Model):

    objects = NodbManager()

    class Meta:
        managed = False
        abstract = True

    @staticmethod
    def get_all_objects():
        msg = 'Every NodbModel must implement its own get_all_objects() method.'
        raise NotImplementedError(msg)
