from copy import copy
from django.db.models import query
from django.db import models



class NodbModel(models.Model):

    class Meta:
        managed = False
        abstract = True

    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    @classmethod
    def all(cls):
        return QuerySet(cls)

    @staticmethod
    def get_all_objects():
        msg = 'Every NodbModel must implement its own get_all_objects() method.'
        raise NotImplementedError(msg)


class QuerySet(query.QuerySet):

    def __init__(self, model):
        self.model = model
        self._current = 0
        self._data = self.model.get_all_objects()
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
            own_attr = super(QuerySet, self).__getattribute__(attr_name)
        except AttributeError:
            pass
        else:
            return own_attr

        if attr_name in vars(self) or attr_name in vars(QuerySet):
            attr = self.oInstance.__getattribute__(attr_name)
            return attr

        msg = 'Call to an attribute `{}` of {} which isn\'t intended to be accessed directly.'
        msg = msg.format(attr_name, QuerySet)
        raise AttributeError(msg)

    def _clone(self):
        return QuerySet(self.model)


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
        def f(obj):
            for key, value in kwargs.items():
                if getattr(obj, key) == value:
                    return True
            return False
        return filter(f, self._data)

