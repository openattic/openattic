# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    replaces = [(b'userprefs', '0001_initial'), (b'userprefs', '0002_remove_userprofile_host')]

    dependencies = [
        ('ifconfig', '0001_squashed_0006_delete_host'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreference',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('setting', models.CharField(max_length=50)),
                ('value', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='userpreference',
            name='profile',
            field=models.ForeignKey(to='userprefs.UserProfile'),
        ),
        migrations.AlterUniqueTogether(
            name='userpreference',
            unique_together=set([('profile', 'setting')]),
        ),
        migrations.AlterUniqueTogether(
            name='userprofile',
            unique_together=set([('user',)]),
        ),
    ]
