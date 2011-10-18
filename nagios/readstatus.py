# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from os.path import getmtime

class NagiosState(object):
    """ Dict-like class to access Nagios's status information.

        The data returned by this object is always up-to-date, because all getters
        check if the file has been updated in the meantime before returning data.
    """
    def __init__(self, statfile="/var/cache/nagios3/status.dat"):
        self.statfile  = statfile
        self.timestamp = 0
        self.nagstate  = None

    def __getitem__(self, name):
        self.update()
        return self.nagstate[name]

    def __len__(self):
        self.update()
        return len(self.nagstate)

    def __iter__(self):
        self.update()
        return iter(self.nagstate)

    def keys(self):
        self.update()
        return self.nagstate.keys()

    def values(self):
        self.update()
        return self.nagstate.values()

    def update(self):
        mtime = getmtime(self.statfile)
        if mtime > self.timestamp:
            self.nagstate  = self.parse_status()
            self.timestamp = mtime

    def parse_status(self):
        ST_BEGINSECT, ST_SECTNAME, ST_BEGINVALUE, ST_VALUE, ST_COMMENT = range(5)
        state = ST_BEGINSECT

        result = {}

        currsect  = ''
        currname  = ''
        currvalue = ''
        curresult = {}

        with open( self.statfile, "rb" ) as nag:
            while True:
                char = nag.read(1)
                if not char:
                    break

                if state == ST_BEGINSECT:
                    if char == '{':
                        raise ValueError("{ but no section name?")
                    elif char in (' ', '\t', '\r', '\n'):
                        pass
                    elif char == '#':
                        state = ST_COMMENT
                    else:
                        currsect += char
                        state = ST_SECTNAME

                elif state == ST_SECTNAME:
                    if char == '{':
                        state = ST_BEGINVALUE
                        if currsect not in result:
                            result[currsect] = []
                    elif char == ' ':
                        pass
                    else:
                        currsect += char

                elif state == ST_BEGINVALUE:
                    if char in (' ', '\t', '\r', '\n'):
                        pass
                    elif char == '=':
                        state = ST_VALUE
                    elif char == '}':
                        state = ST_BEGINSECT
                        result[currsect].append(curresult)
                        curresult = {}
                        currsect = ''
                    else:
                        currname += char

                elif state == ST_VALUE:
                    if char == '\r':
                        pass
                    elif char == '\n':
                        state = ST_BEGINVALUE
                        curresult[currname] = currvalue
                        currname  = ''
                        currvalue = ''
                    else:
                        currvalue += char

                elif state == ST_COMMENT:
                    if char == '\n':
                        state = ST_BEGINSECT

        return result
