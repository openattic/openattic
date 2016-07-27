

import logging
import os

if os.environ.get("DJANGO_SETTINGS_MODULE"):
    from django.conf import settings


def distro_settings(distro_specific=['/etc/default/openattic', '/etc/sysconfig/openattic']):
    """
    Read the custom settings for a distribution to override defaults. Debian
    and Ubuntu use /etc/default/openattic. SUSE and RedHat use 
    /etc/sysconfig/openattic.

    Returns a dict for non-Django environments
    Sets settings object for Django environments
    """
    logger = logging.getLogger(__name__)
    
    _settings = {}
    for filename in distro_specific:
        if os.path.isfile(filename):
            logger.info("Reading %s", filename)
            with open(filename, "r") as f:
                for line in f:
                    line = line.rstrip()
                    if line and not line.startswith('#'):
                        key, value = line.split('=')
                        value = value.strip('"\'')
                        logger.debug("Setting %s=%s", key, value)
                        _settings[key] = value
                        if os.environ.get("DJANGO_SETTINGS_MODULE"):
                            setattr(settings, key, value)
                        
    return _settings
