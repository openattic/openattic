# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from iscsi.models import Target

def conf():
    res = ""
    for target in Target.objects.all():
        res += "Target %s\n" % target.name

        for lun in target.lun_set.all():
            res += "\tLun %d Path=%s,Type=%s\n" % (lun.number, lun.volume.path, lun.ltype)
            if lun.alias:
                res += "\tAlias %s\n" % lun.alias
    return res
