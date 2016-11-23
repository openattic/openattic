# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ifconfig', '0002_auto_20160329_1248'),
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
                ('host', models.ForeignKey(to='ifconfig.Host')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='userpreference',
            name='profile',
            field=models.ForeignKey(to='userprefs.UserProfile'),
        ),
        migrations.AlterUniqueTogether(
            name='userprofile',
            unique_together=set([('user', 'host')]),
        ),
        migrations.AlterUniqueTogether(
            name='userpreference',
            unique_together=set([('profile', 'setting')]),
        ),
    ]
