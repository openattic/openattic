# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('nagios', '0002_auto_20170126_1628'),
    ]

    ids_to_delete = "(8, 9, 10, 13, 14, 17, 18)"

    operations = [
        migrations.RunSQL('DELETE FROM nagios_graph;'),
        migrations.RunSQL(
            'DELETE FROM nagios_service WHERE nagios_service.command_id IN {};'.format(
                ids_to_delete)),
        migrations.RunSQL('DELETE FROM nagios_command WHERE id in {};'.format(ids_to_delete)),
    ]
