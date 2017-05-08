"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

import logging
import os


def distro_settings(distro_specific=['/etc/default/openattic', '/etc/sysconfig/openattic']):
    """
    Read the custom settings for a distribution to override defaults. Debian and Ubuntu use
    /etc/default/openattic. SUSE and RedHat use /etc/sysconfig/openattic.

    Returns a dict for non-Django environments
    Sets settings object for Django environments
    
    The parser functionality is basiclly the same as in `backend/settings.py`. This code can safely
    be removed if Nagios/Icinga is replaced by another monitoring system/tool as the code in
    `backend/settings.py` imports settings into the global settings variable but this function is
    only used to retrieve distribution specific settings for Nagios/Icinga checks like paths and
    does not write to the global settings variable anymore.

    Note that the settings in the above specified files are also used in `oaconfig` and imported
    as shell variables.
    """
    logger = logging.getLogger(__name__)

    _settings = {}
    for filename in distro_specific:
        if os.path.isfile(filename):
            logger.debug("Reading %s", filename)
            with open(filename, "r") as f:
                for line in f:
                    line = line.rstrip()
                    if line and not line.startswith('#'):
                        key, value = line.split('=')
                        value = value.strip('"\'')
                        logger.debug("Setting %s=%s", key, value)
                        _settings[key] = value

    return _settings
