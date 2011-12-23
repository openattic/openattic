# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from optparse import make_option

from django.core.management.base import BaseCommand
from django.contrib.auth.models  import User
from django.conf import settings

from rpcd.models   import APIKey

class Command( BaseCommand ):
    help = "Creates a new API Key."

    option_list = BaseCommand.option_list + (
        make_option( "-u", "--user",
            help="The username who is supposed to be the owner of the key.",
            default=None
            ),
        make_option( "-d", "--description",
            help="The description of the key.",
            default=""
            ),
        make_option( "-a", "--inactive",
            help="True if the key should be inactive.",
            default=False, action="store_true"
            ),
    )

    def handle(self, **options):
        if not options['user']:
            raise ValueError("No User given")

        uu = User.objects.get(username=options['user'])
        key = APIKey( owner=uu, description=options['description'], active=(not options['inactive']) )
        key.full_clean()
        key.save()
        print key.apikey

