# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from optparse import make_option

from django.core.management.base import BaseCommand
from django.contrib.auth.models  import User

class Command( BaseCommand ):
    help = "Prints to console whether or not the database currently has an admin user."

    def handle(self, **options):
        if User.objects.filter( is_superuser=True ).count():
            print "yes"
        else:
            print "no"
