from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from rest_framework import serializers, viewsets

from nodb.models import NodbModel


class NodbSerializer(serializers.ModelSerializer):

    class Meta:
        model = NodbModel


class NodbViewSet(viewsets.ModelViewSet):
    serializer_class = NodbSerializer

    def paginate(self, iterable, request):
        """Automatically paginates the given set of items according to the given request."""

        page_size = request.QUERY_PARAMS.get('pageSize', 10)
        page = request.QUERY_PARAMS.get('pages', 1)

        paginator = Paginator(iterable, page_size)
        try:
            iterable = paginator.page(page)
        except PageNotAnInteger:
            iterable = paginator.page(1)
        except EmptyPage:
            # The list index is out of range, so take the last page and display it.
            iterable = paginator.page(paginator.num_pages)

        return iterable
