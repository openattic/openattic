# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django        import forms
from django.conf   import settings

from iscsi.models import Lun

class LunForm(forms.ModelForm):
    class Meta:
        model = Lun
