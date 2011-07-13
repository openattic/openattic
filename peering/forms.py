# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from xmlrpclib import ServerProxy

from django import forms

from peering.models import PeerHost

class PeerHostForm(forms.ModelForm):
    class Meta:
        model = PeerHost

    def clean_base_url(self):
        base_url = self.cleaned_data["base_url"]
        sp = ServerProxy(base_url)
        try:
            sp.ping()
        except Exception, e:
            raise forms.ValidationError(unicode(e))
        else:
            return base_url
