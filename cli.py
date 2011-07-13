#!/usr/bin/env python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import json

from xmlrpclib    import ServerProxy
from ConfigParser import ConfigParser
from optparse     import OptionParser
from pprint import pprint
from cmd import Cmd


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

if options.encoding is None:
    try:
        locale = os.environ['LANG']
        _, options.encoding = locale.split('.')
    except (KeyError, ValueError):
        options.encoding = "UTF-8"

print >> sys.stderr, "Connecting..."
server = ServerProxy(options.connect, allow_none=True)
try:
    server.ping()
except Exception, e:
    sys.exit("Could not connect to the server: " + unicode(e))


# Output formatters

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

formatters = {
    'json':  lambda something: json.dumps(something, indent=4),
    'shell': out_shell
    }



def clean_args(args):
    """ Clean the arguments that have been passed to us on the shell, by converting
        them to the correct data type and making sure they are decoded correctly.
    """
    cleanargs = []
    for param in args:
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
    stripped = argstr.strip()
    if stripped:
        return call(sectname, cmd, stripped.split(' ')) #TODO: shlex
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
    # You are SO gonna hate me.

    class BaseCommand(Cmd, object):
        """ Implements basic functions of each shell section. """
        def do_exit(self, args):
            print "Bye"

        def do_EOF(self, args):
            print

        def postcmd(self, stop, line):
            if line in ("exit", "EOF"):
                return True
            return False

        def enter_subsection(self, name):
            """ Check if we have an attribute named subsection_<name>, and if so,
                execute it as a subshell.
            """
            subsect = getattr(self, 'subsection_'+name, None)
            if subsect is not None:
                subsect().cmdloop()


    def buildCallFunction(cmd, prevparts):
        """ Create a wrapper function around call_argstr(). """
        def do_cmd(self, args):
            return call_argstr( '.'.join(prevparts), cmd, args )
        do_cmd.__name__ = 'do_'+cmd
        return do_cmd

    def buildHelpFunction(cmd, prevparts):
        """ Create a wrapper function around call_argstr(). """
        fullname = '.'.join(prevparts + [cmd])
        def help_cmd(self):
            argspec = server.get_function_args( fullname )
            print server.system.methodHelp( fullname )
            print "Usage: %s %s" % ( fullname, ' '.join([('<%s>' % a) for a in argspec]) )
        help_cmd.__name__ = 'help_'+cmd
        return help_cmd


    def buildSubSectionWrapper(name, prevparts):
        """ Create a wrapper function around BaseCommand.enter_subsection(). """
        def do_cmd(self, args):
            return self.enter_subsection(name)
        do_cmd.__name__ = 'do_'+name
        do_cmd.__doc__  = ("Enter section '%s'." % '.'.join(prevparts + [name]))
        return do_cmd


    def buildShellSection(name, prevparts, methods):
        """ Creates a BaseCommand sub*class* that implements a shell section. """
        attrs = {
            'prompt':  name + '> ',
            }
        for cmd in methods:
            if methods[cmd]:
                attrs['subsection_'+cmd] = buildShellSection(cmd, prevparts+[cmd], methods[cmd])
                attrs['do_'+cmd]   = buildSubSectionWrapper(cmd, prevparts)
            else:
                attrs['do_'+cmd]   = buildCallFunction(cmd, prevparts)
                attrs['help_'+cmd] = buildHelpFunction(cmd, prevparts)

        return type('Cmd'+name, (BaseCommand, ), attrs)


    # Build a method tree structure to build the shell from
    methods = {}
    for method in server.system.listMethods():
        container = methods
        for part in method.split('.'):
            if part not in container:
                container[part] = {}
            container = container[part]

    print >> sys.stderr, "Building shell..."
    main = buildShellSection("main", [], methods)()
    main.prompt = "#> "
    main.cmdloop()
