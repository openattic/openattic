# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

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

    def clean_volume(self):
        volume = self.cleaned_data['volume']
        if volume.filesystem:
            raise forms.ValidationError("Cannot create a DRBD device on a volume which has a filesystem.")
        return volume
