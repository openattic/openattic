# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django import forms

from drbd.models import DrbdDevice

class DrbdDeviceForm(forms.ModelForm):
    class Meta:
        model = DrbdDevice
        widgets = {
            'protocol': forms.RadioSelect,
            'sb_0pri': forms.RadioSelect,
            'sb_1pri': forms.RadioSelect,
            'sb_2pri': forms.RadioSelect,
            'fencing': forms.RadioSelect,
            'on_io_error': forms.RadioSelect,
        }
