

import logging
import os

from django.conf import settings


def distro_settings():
    """
    Read the custom settings for a distribution to override defaults. Debian
    and Ubuntu use /etc/default/openattic. SUSE and RedHat use 
    /etc/sysconfig/openattic.
    """
    distro_specific = [ '/etc/default/openattic', '/etc/sysconfig/openattic' ]
    logger = logging.getLogger(__name__)
    
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
                        setattr(settings, key, value)

