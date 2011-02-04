from django.views.generic import create_update
from django.contrib.auth.views import redirect_to_login

def create_if_perm(request, *args, **kwargs):
    if "perm" not in kwargs or request.user.has_perm(kwargs["perm"]):
        del kwargs["perm"]
        return create_update.create_object(request, *args, **kwargs)
    else:
        return redirect_to_login(request.path)

def update_if_perm(request, *args, **kwargs):
    if "perm" not in kwargs or request.user.has_perm(kwargs["perm"]):
        del kwargs["perm"]
        return create_update.update_object(request, *args, **kwargs)
    else:
        return redirect_to_login(request.path)

def delete_if_perm(request, *args, **kwargs):
    if "perm" not in kwargs or request.user.has_perm(kwargs["perm"]):
        del kwargs["perm"]
        return create_update.delete_object(request, *args, **kwargs)
    else:
        return redirect_to_login(request.path)
