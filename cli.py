#!/usr/bin/env python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on

import readline
import os, sys
import json
import os.path

from xmlrpclib    import ServerProxy, DateTime
from ConfigParser import ConfigParser
from optparse     import OptionParser
from datetime     import datetime
from pprint import pprint
from cmd import Cmd


# First of all, let's do some option parsing, shall we?

parser = OptionParser()

parser.add_option( "-v", "--verbose",
    help="Verbose output of messages.",
    action="store_true", default=False
    )

parser.add_option( "-c", "--connect",
    help="An URL to connect to.",
    default="http://localhost:31234/"
    )

parser.add_option( "-o", "--outformat",
    help="Output format. Standard is JSON.",
    default="json"
    )

parser.add_option( "-e", "--encoding",
    help="Character set arguments are encoded in. Default: Read from LANG env variable with fallback to UTF-8.",
    default=None
    )

options, progargs = parser.parse_args()


# Make sure we have an encoding defined
if options.encoding is None:
    try:
        locale = os.environ['LANG']
        _, options.encoding = locale.split('.')
    except (KeyError, ValueError):
        options.encoding = "UTF-8"


# Try to connect to the given server.
if options.verbose:
    print >> sys.stderr, "Connecting..."

server = ServerProxy(options.connect, allow_none=True)
try:
    server.ping()
except Exception, e:
    sys.exit("Could not connect to the server: " + unicode(e))

# Retrieve hostname from the server
hostname = server.hostname()



# Check if using colors on stdout is sensible
if sys.stdout.isatty():
    HOSTCOLOR = '\033[1;32m'
    SECTCOLOR = '\033[1;34m'
    CLRCOLOR  = '\033[0m'
else:
    HOSTCOLOR = SECTCOLOR = CLRCOLOR = ""

def hostcolorize(text):
    return HOSTCOLOR + text + CLRCOLOR

def sectcolorize(text):
    return SECTCOLOR + text + CLRCOLOR



# Output formatters that turn whatever the server returns into useful shell output
def out_shell(something):
    lines = []
    if isinstance(something, list):
        for item in something:
            lines.append(unicode(item))
    elif isinstance(something, dict):
        for key in something:
            lines.append("%s='%s'" % (key, something[key]))
    else:
        lines.append(unicode(something))
    return "\n".join(lines)

def json_format(something):
    if isinstance(something, DateTime):
        # This is a DateTime object from xmlrpclib. Convert to a standard datetime.
        something = datetime( *something.timetuple()[:6] )
    if hasattr(something, 'isoformat'):
        return something.isoformat()
    return json.dumps(something)

formatters = {
    'json':  lambda something: json.dumps(something, indent=4, default=json_format),
    'shell': out_shell
    }



# Argument line parser
def shlox( line, escape='\\', comment='#', sep=(' ', '\t', '\r', '\n' ) ):
    """ State machine that parses stuff like bash does, with the additional benefit of also
        being able to parse JSON for more complex arguments.
    """
    ST_NORMAL, ST_ESCAPE, ST_SINGLE_QUOTED, ST_DOUBLE_QUOTED, ST_DOUBLE_ESCAPE, ST_JSON_DICT, ST_JSON_LIST = range(7)

    state = ST_NORMAL
    bracelevel = 0

    word  = ''
    empty = True

    for char in line:
        if   state == ST_NORMAL:
            if   char == escape:
                state = ST_ESCAPE
            elif char == '"':
                empty = False
                state = ST_DOUBLE_QUOTED
            elif char == "'":
                empty = False
                state = ST_SINGLE_QUOTED
            elif char == '{':
                empty = False
                state = ST_JSON_DICT
                bracelevel = 0
                word += char
            elif char == '[':
                empty = False
                state = ST_JSON_LIST
                bracelevel = 0
                word += char
            elif char == comment:
                if empty:
                    raise StopIteration
                else:
                    word += char
            elif char in sep:
                if not empty:
                    yield word
                    empty = True
                    word  = ''
            else:
                empty = False
                word += char

        elif state == ST_ESCAPE:
            word += char
            state = ST_NORMAL

        elif state == ST_SINGLE_QUOTED:
            if   char == "'":
                state = ST_NORMAL
            else:
                word += char

        elif state == ST_DOUBLE_QUOTED:
            if   char == escape:
                state = ST_DOUBLE_ESCAPE
            elif char == '"':
                state = ST_NORMAL
            else:
                word += char

        elif state == ST_DOUBLE_ESCAPE:
            if   char in ( escape, comment, '"', "'" ) + sep:
                word += char
            else:
                word += '\\' + char
            state = ST_DOUBLE_QUOTED

        elif state == ST_JSON_DICT:
            word += char
            if char == '{':
                bracelevel += 1
            elif char == '}':
                if bracelevel > 0:
                    bracelevel -= 1
                else:
                    yield json.loads(word)
                    empty = True
                    word  = ''
                    state = ST_NORMAL

        elif state == ST_JSON_LIST:
            word += char
            if char == '[':
                bracelevel += 1
            elif char == ']':
                if bracelevel > 0:
                    bracelevel -= 1
                else:
                    yield json.loads(word)
                    empty = True
                    word  = ''
                    state = ST_NORMAL

    if state != ST_NORMAL:
        raise ValueError( "Unclosed quote or \\ at end of line." )

    elif not empty:
        yield word




def clean_args(args):
    """ Clean the arguments that have been passed to us on the shell, by converting
        them to the correct data type and making sure they are decoded correctly.
    """
    cleanargs = []
    for param in args:
        if isinstance( param, (list, dict) ):
            cleanargs.append(param)
            continue
        try:
            argtype, argval = param.split(':', 1)
        except ValueError:
            cleanargs.append( param.decode(options.encoding) )
        else:
            cleanval = {
                'bool':   lambda val: val in ('True', 'true', '1', 'Yes', 'yes'),
                'int':    int,
                'float':  float,
                'string': str
                }[ argtype ]( argval )

            if argtype == 'string':
                cleanval = cleanval.decode(options.encoding)
            cleanargs.append(cleanval)
    return cleanargs


def call(sectname, cmd, args):
    """ Handle a command which needs to be mapped to an XMLRPC function call. """
    if sectname:
        handler = getattr( server, sectname )
        fullname = '%s.%s' % (sectname, cmd)
    else:
        handler  = server
        fullname = cmd
    func = getattr( handler, cmd )

    argspec = server.get_function_args( fullname )
    args = clean_args(args)

    if( len(args) != len(argspec) ):
        print "Usage: %s %s" % ( fullname, ' '.join([('<%s>' % a) for a in argspec]) )
    else:
        try:
            formatted = formatters[options.outformat]( func(*args) )
            print formatted.encode(options.encoding)
        except Exception, e:
            print >> sys.stderr, unicode(e)


def call_argstr(sectname, cmd, argstr):
    """ Parse the given argstr into a list, then call() the method given in cmd. """
    stripped = argstr.strip()
    if stripped:
        try:
            parsed = list(shlox(stripped))
        except Exception, e:
            print >> sys.stderr, "Error when parsing command line:", unicode(e)
        else:
            return call(sectname, cmd, parsed)
    else:
        return call(sectname, cmd, [])



if progargs:
    # handle the command given on the shell and exit.
    parts = progargs[0].rsplit('.', 1)
    if len(parts) == 2:
        section, cmd = parts
    else:
        section = ""
        cmd = parts[0]
    call(section, cmd, progargs[1:])

else:
    # You are SO gonna hate me. If you don't already. Brace yourself, lots'a closures ahead.
    # Load command history, if possible
    if sys.stdin.isatty() and "HOME" in os.environ and os.environ["HOME"]:
        try:
            readline.read_history_file( os.path.join( os.environ["HOME"], '.oacli_history' ) )
        except Exception, e:
            print >> sys.stderr, "Error loading the history file:", unicode(e)



    class BaseCommand(Cmd, object):
        """ Implements basic functions of each shell section. """
        def do_exit(self, args):
            """ Leave this section (or the shell altogether if in the highest section). """
            print "Bye"

        def do_EOF(self, args):
            """ Leave this section (or the shell altogether if in the highest section).
                This command is invoked by typing ^d.
            """
            print

        def emptyline(self):
            # srsly what the fuck
            pass

        def postcmd(self, stop, line):
            """ Check if the last command was an exit command. If so exit, otherwise add it to the history. """
            if line in ("exit", "EOF"):
                return True
            if line:
                readline.add_history(line)
            return False

        def enter_subsection(self, name):
            """ Check if we have an attribute named subsection_<name>, and if so,
                execute it as a subshell.
            """
            subsect = getattr(self, 'subsection_'+name, None)()
            if subsect is not None:
                while True:
                    try:
                        subsect.cmdloop()
                    except KeyboardInterrupt:
                        # Eat this exception. I want to be able to hit ^c to cancel typing stuff, so just...
                        print '^C' # and restart the shell.
                    else:
                        # Subshell terminated normally, so break the while loop.
                        break


    def buildCallFunction(cmd, prevparts):
        """ Create a wrapper function around call_argstr(). Prevparts contains
            the section names, cmd is the command name, args will be passed at runtime.
        """
        def do_cmd(self, args):
            return call_argstr( '.'.join(prevparts), cmd, args )
        do_cmd.__name__ = 'do_'+cmd
        return do_cmd

    def buildHelpFunction(cmd, prevparts):
        """ Create a function that prints help text for the given command by
            requesting the Docstring of the exported function from the server.
        """
        fullname = '.'.join(prevparts + [cmd])
        def help_cmd(self):
            argspec = server.get_function_args( fullname )
            print server.system.methodHelp( fullname )
            print "Usage: %s %s" % ( fullname, ' '.join([('<%s>' % a) for a in argspec]) )
        help_cmd.__name__ = 'help_'+cmd
        return help_cmd


    def buildSubSectionWrapper(name, prevparts):
        """ Create a wrapper function around enter_subsection to change the shell in foreground. """
        def do_cmd(self, args):
            return self.enter_subsection(name)
        do_cmd.__name__ = 'do_'+name
        do_cmd.__doc__  = ("Enter section '%s'." % '.'.join(prevparts + [name]))
        return do_cmd


    def buildShellSection(name, prevparts, methods):
        """ Creates a BaseCommand sub*class* that implements a shell section.

            The methods dict specified what commands are to exist here. Non-empty values
            mean subsections, empty values mean commands.
        """
        attrs = {
            'prompt': "%s:%s> " % ( hostcolorize(hostname), sectcolorize('.'.join(prevparts)) ),
            }
        for cmd in methods:
            if methods[cmd]:
                attrs['subsection_'+cmd] = buildShellSection(cmd, prevparts+[cmd], methods[cmd])
                attrs['do_'+cmd]   = buildSubSectionWrapper(cmd, prevparts)
            else:
                attrs['do_'+cmd]   = buildCallFunction(cmd, prevparts)
                attrs['help_'+cmd] = buildHelpFunction(cmd, prevparts)

        return type('Cmd'+name, (BaseCommand, ), attrs)


    # Build a method tree structure to build the shell from. The structure looks like:
    # { 'lvm': { 'LogicalVolume': { 'add': {},
    #                               'get': {} },
    #            'VolumeGroup': { 'add': {},
    #                             'get': {} } },
    #   'nfs': { 'Export': { 'add': {},
    #                        'get': {} } }
    # }
    # That is, each key with a non-empty value will become a section, others will be commands.
    methods = {}
    for method in server.system.listMethods():
        container = methods
        for part in method.split('.'):
            if part not in container:
                container[part] = {}
            container = container[part]

    if options.verbose:
        print >> sys.stderr, "Building shell..."
    main = buildShellSection("main", [], methods)()
    main.prompt = "%s:%s> " % ( hostcolorize(hostname), sectcolorize('#') )

    while True:
        try:
            main.cmdloop()
        except KeyboardInterrupt:
            # Eat this exception. I want to be able to hit ^c to cancel typing stuff, so just...
            print '^C' # and restart the shell.
        else:
            # Subshell terminated normally, so break the while loop.
            break

    # Write the history file, if possible
    if sys.stdin.isatty() and "HOME" in os.environ and os.environ["HOME"]:
        try:
            readline.write_history_file( os.path.join( os.environ["HOME"], '.oacli_history' ) )
        except Exception, e:
            print >> sys.stderr, "Error writing the history file:", unicode(e)
