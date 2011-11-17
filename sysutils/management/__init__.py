# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

try:
    import readline
except ImportError:
    pass

import sysutils.models
from sysutils.models  import NTP
from django.db.models import signals

def create_ntp(app, created_models, verbosity, **kwargs):
    try:
        NTP.objects.get(id=1)
    except NTP.DoesNotExist:
        if not kwargs.get('interactive', True):
            print "Skipping initialization of the NTP module."
    else:
        print "The NTP module has already been initialized before."
        return

    if kwargs.get('interactive', True):
        server = raw_input("Please enter the address of the NTP server: ")
        s = NTP(id=1, server=server)
        s.save()
        print "The NTP module has been initialized successfully."

signals.post_syncdb.connect(create_ntp, sender=sysutils.models)
