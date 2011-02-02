# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django        import forms
from django.conf   import settings

from lvm.models import LogicalVolume

class LvForm(forms.ModelForm):
    class Meta:
        model = LogicalVolume

class LvEditForm(LvForm):
    class Meta:
        fields = ['megs']
