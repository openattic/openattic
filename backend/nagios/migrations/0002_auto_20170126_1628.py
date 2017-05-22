# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('nagios', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL('DELETE FROM nagios_service WHERE description = \'openATTIC RPCd\';'),
        migrations.RunSQL('DELETE FROM nagios_command WHERE name in (\'check_openattic_rpcd\','
                          '\'check_drbd\', \'check_twraid_unit\');'),
        # Removed, cause it fails, if sysutils.migrations.0002_delete_initscript was already
        # applied.
        # migrations.RunSQL('DELETE FROM sysutils_initscript WHERE name = \'openattic_rpcd\';')
    ]
