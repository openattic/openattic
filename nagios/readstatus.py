# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

def parse_status(statfile="/var/cache/nagios3/status.dat"):
    ST_BEGINSECT, ST_SECTNAME, ST_BEGINVALUE, ST_VALUE, ST_COMMENT = range(5)
    state = ST_BEGINSECT

    result = {}

    currsect  = ''
    currname  = ''
    currvalue = ''
    curresult = {}

    with open( statfile, "rb" ) as nag:
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
