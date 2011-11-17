# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

try:
    import readline
except ImportError:
    pass

import ssmtp.models
from ssmtp.models     import SSMTP
from django.db.models import signals

def create_ssmtp(app, created_models, verbosity, **kwargs):
    try:
        SSMTP.objects.get(id=1)
    except SSMTP.DoesNotExist:
        if not kwargs.get('interactive', True):
            print "Skipping initialization of the SSMTP module."
    else:
        print "The SSMTP module has already been initialized before."
        return

    if kwargs.get('interactive', True):
        mailhub       = raw_input("Please enter the mail hub that should be used to deliver email: ")
        root          = raw_input("Please enter the email address where mail for root should be sent to: ")
        rewriteDomain = raw_input("Please enter the domain from which mail should appear to be from: ")
        s = SSMTP(id=1, mailhub=mailhub, root=root, rewriteDomain=rewriteDomain)
        s.save()
        print "The SSMTP module has been initialized successfully."

signals.post_syncdb.connect(create_ssmtp, sender=ssmtp.models)
