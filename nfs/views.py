# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from nfs.models import Export

def conf():
    res = ""
    for export in Export.objects.all():
        res += "%-50s %s(%s)\n" % ( export.path, export.address, export.options )
    return res
