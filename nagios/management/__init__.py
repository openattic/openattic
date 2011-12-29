# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.core.management import call_command

from nagios.conf import settings as nagios_settings

import nagios.models
from nagios.models    import Service, Command
from django.db.models import signals

def create_nagios(app, created_models, verbosity, interactive, db, **kwargs):
    # First of all, make sure our fixtures have been loaded
    call_command('loaddata', 'nagios/fixtures/initial_data.json', verbosity=verbosity, database=db)

    for servstate in Service.nagstate["servicestatus"]:
        cmdargs = servstate["check_command"].split('!')
        cmdname = cmdargs[0]
        cmdargs = cmdargs[1:]

        try:
            cmd = Command.objects.get( name=cmdname )
        except Command.DoesNotExist:
            # Commands that don't exist have not been configured by us, so query_only
            print "Adding Check Command %s" % cmdname
            cmd = Command( name=cmdname, query_only=True )
            cmd.save()

        if not cmd.query_only:
            continue

        try:
            serv = Service.objects.get( description=servstate["service_description"], command=cmd )
        except Service.DoesNotExist:
            print "Adding Service '%s'" % servstate["service_description"]
            serv = Service( description=servstate["service_description"], command=cmd, arguments=('!'.join(cmdargs)) )
            serv.save()

    # read /proc/stat
    fd = open("/proc/stat", "r")
    try:
        sys_stats = [ line.split() for line in fd ]
    except:
        return

    cpumax = 0
    for rec in sys_stats:
        if rec[0] != "cpu" and rec[0].startswith("cpu"):
            cpumax = int(rec[0][3])

    print "CPUCPUCPUC", cpumax
    cmd = Command.objects.get(name=nagios_settings.CPUTIME_CHECK_CMD)
    for cpu in range(cpumax + 1):
        if Service.objects.filter(command=cmd, arguments=str(cpu)).count() == 0:
            serv = Service(
                command     = cmd,
                description = nagios_settings.CPUTIME_DESCRIPTION % cpu,
                arguments   = str(cpu)
                )
            serv.save()

signals.post_syncdb.connect(create_nagios, sender=nagios.models)
