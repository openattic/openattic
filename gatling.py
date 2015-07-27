#!/usr/bin/env python
# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import os.path
import sys
import unittest
import xmlrunner
import datetime
import requests
import json

from functools    import partial
from ConfigParser import ConfigParser
from optparse     import OptionParser
from testtools.run import TestProgram

from colorizer    import NovaTestResult

def main():
    basedir = os.path.dirname(os.path.abspath(__file__))

    priorargs = []
    for arg in sys.argv:
        priorargs.append(arg)
        if arg == '--':
            break

    class TestProgramAwareOptionParser(OptionParser):
        """ OptionParser that is aware that options after -- are passed to TestProgram,
            and that prints TestProgram's --help after printing its own.
        """
        def print_help(self, file=None):
            if file is None:
                file = sys.stdout
            print >> file, "Gatling options"
            print >> file, "==================="
            OptionParser.print_help(self, file)
            print >> file, ""
            print >> file, "TestProgram options"
            print >> file, "==================="
            if "-h" in priorargs:
                priorargs.remove("-h")
            if "--help" in priorargs:
                priorargs.remove("--help")
            TestProgram(argv=[' '.join(priorargs + ["--"]), "-h"], stdout=file)

    parser = TestProgramAwareOptionParser("Usage: %prog [options] -- [TestProgram options]")

    parser.add_option("--xml", default=False, action="store_true",
                      help="Generate XML output compatible to JUnit.")
    parser.add_option("--xml-reports", default="test-reports",
                      help="Directory to store test result XML files in [test-reports].")
    parser.add_option("--config", action="append", default=[],
                      help="Location of gatling.conf. Can be used multiple times.")
    parser.add_option("-t", "--target", default="",
                      help="Target node. Alias for '--config gatling.conf --config conf/<target>.conf'. "
                           "If --target is specified, --config options are ignored.")

    options, posargs = parser.parse_args()

    conf = ConfigParser()

    if options.target:
        conf.read([
            os.path.join(basedir, "gatling.conf"),
            os.path.join(basedir, "conf", "%s.conf" % options.target)
        ])
    elif options.config:
        conf.read(options.config)
    else:
        conf.read(os.path.join(basedir, "gatling.conf"))


    class GatlingTestSuite(unittest.TestSuite):
        """ TestSuite that monkeypatches loaded tests with config objects. """
        def addTest(self, test):
            unittest.TestSuite.addTest(self, test)
            test.__class__.conf = conf
            test.conf = conf

    class GatlingTestLoader(unittest.TestLoader):
        """ TestLoader that uses GatlingTestSuite to load tests. """
        suiteClass = GatlingTestSuite

    class GatlingTestProgram(TestProgram):
        """ Overrides TestProgram to use GatlingTestLoader for its test discovery. """
        def _do_discovery(self, argv, Loader=None):
            return TestProgram._do_discovery(self, argv, Loader=GatlingTestLoader)

    # Decide which test runner to use. Jenkins calls gatling with --xml in order to
    # create machine-readable reports; human users will prefer a colorized report.
    if options.xml:
        runner = partial(xmlrunner.XMLTestRunner, output=options.xml_reports, verbosity=2)
    else:
        runner = partial(unittest.TextTestRunner, resultclass=NovaTestResult)

    # If we don't have any arguments for TestProgram and this doesn't seem to be
    # intentional, discover tests and print individual results.
    if not posargs and "--" not in sys.argv:
        posargs = ["discover", "-v"]

    # Instantiate another GatlingTestLoader to be used when discovery is *not* active.
    loader = GatlingTestLoader()

    starttime = datetime.datetime.now()
    prog = GatlingTestProgram(argv=[' '.join(priorargs)] + posargs, testRunner=runner, testLoader=loader, exit=False)
    endtime = datetime.datetime.now()

    header = {"Authorization": "Token %s" % conf.get("options", "auth_token")}
    base_url = conf.get("options", "connect")
    cmdlog_filter = "cmdlogs?exitcode=1&start_datetime=%s&end_datetime=%s" % (starttime, endtime)

    failedcmds = requests.request("GET", "%s%s" % (base_url, cmdlog_filter), headers=header)
    failedcmds = json.loads(failedcmds.text)

    if failedcmds['count'] > 0:
        print "openATTIC's command log recorded %d failed commands during the test period:" % failedcmds['count']
        template = ("%(command)s (%(starttime)s - %(endtime)s):\n"
                    "%(text)s\n")
        for failedcmd in failedcmds['results']:
            print template % failedcmd
    else:
        print "openATTIC's command log did not record any failed commands during the test period."

    if prog.result.wasSuccessful() and failedcmds['count'] > 0:
        return 0
    else:
        return 1

if __name__ == '__main__':
        sys.exit(main())

