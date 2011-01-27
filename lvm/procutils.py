# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import sys
import subprocess
from signal import signal, SIGTERM, SIGINT, SIG_DFL

def invoke(args):
    print args
    proc = subprocess.Popen(args,
        stdin  = sys.stdin,
        stdout = sys.stdout,
        stderr = sys.stderr
        )

    def fwdsigterm(signum, frame):
        proc.send_signal(SIGTERM)
        signal(SIGTERM, fwdsigterm)

    signal(SIGTERM, fwdsigterm)
    signal(SIGINT, fwdsigterm)
    proc.wait()
    signal(SIGTERM, SIG_DFL)
    signal(SIGINT, SIG_DFL)
