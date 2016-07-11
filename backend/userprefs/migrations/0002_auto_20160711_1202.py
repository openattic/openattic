# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import userprefs.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ifconfig', '0002_auto_20160329_1248'),
        ('userprefs', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userprofile',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='host',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='user',
        ),
        migrations.AddField(
            model_name='userpreference',
            name='host',
            field=models.ForeignKey(default=userprefs.models.get_default_host, to='ifconfig.Host'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='userpreference',
            name='user',
            field=models.ForeignKey(default=userprefs.models.get_default_user, to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AlterUniqueTogether(
            name='userpreference',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='userpreference',
            name='profile',
        ),
        migrations.DeleteModel(
            name='UserProfile',
        ),
    ]
