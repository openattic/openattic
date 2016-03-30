from rest_framework import serializers, viewsets
from nodb.models import NodbModel


class NodbSerializer(serializers.ModelSerializer):

    class Meta:
        model = NodbModel


class NodbViewSet(viewsets.ModelViewSet):
    serializer_class = NodbSerializer
