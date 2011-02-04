# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

def project_url(request):
    from django.conf import settings
    return {'PROJECT_URL': settings.PROJECT_URL}
