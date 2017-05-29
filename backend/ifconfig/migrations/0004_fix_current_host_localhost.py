# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


def fix_host_equals_localhost(apps, schema_editor):
    import ifconfig.models as ifconfig
    Host = apps.get_model("ifconfig", "Host")
    hosts = {h.name: h for h in Host.objects.filter(is_oa_host=True)}

    if not 'localhost' in hosts or ifconfig.get_host_name() in hosts:
        return

    if len(hosts) > 1:
        raise ValueError('Database inconsistency. Please flush the openATTIC database.')

    host = hosts['localhost']
    host.name = ifconfig.get_host_name()
    host.save()


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0003_host_is_oa_host'),
        ('volumes', '0002_remove'),
    ]

    operations = [
        migrations.RunPython(code=fix_host_equals_localhost, reverse_code=lambda a, s: True)
    ]
