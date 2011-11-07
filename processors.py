# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

def project_url(request):
    from django.conf import settings
    return {'PROJECT_URL': settings.PROJECT_URL}

def profile(request):
    if not request.user.is_authenticated():
        return {}
    else:
        try:
            profile = request.user.get_profile()
        except UserProfile.DoesNotExist:
            profile = UserProfile(user=request.user)
            profile.save()

        return {"PROFILE": profile}

