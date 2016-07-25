# -*- coding: utf-8 -*-
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

import gobject
from taskqueue.models import TaskQueue

logger = logging.getLogger(__name__)

class TaskQueueManager(gobject.GObject):

    def __init__(self):
        gobject.GObject.__init__(self)
        self.timeout_id = gobject.timeout_add_seconds(5, self.on_timeout, None)

    def on_timeout(self, user_data):
        actives = TaskQueue.objects.filter(finished=None)
        logger.debug('Running tasks: {}'.format(actives))
        for task in actives:
            try:
                task.on_map()
            except Exception as e:  # Don't let one exception stop kill this timer.
                logger.exception(
                    'Exception when running "{}". Dont throw exceptions into this '
                    'event handler.'.format(task))

        return True



