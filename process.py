#!/usr/bin/env python
# -*- coding: utf-8 -*-

import multiprocessing
import time
import random
import rados
import sys


class Worker(multiprocessing.Process):
    def __init__(self, con_pipe):
        multiprocessing.Process.__init__(self)
        self.con_pipe = con_pipe

    def run(self):
        sleep = 5
        time.sleep(sleep)

        print "Hey, worker {} exiting after {} seconds.".format(self.name, sleep)

        random_number = random.randint(0, 100)
        self.con_pipe.send(random_number)
        self.con_pipe.close()


if __name__ == '__main__':
    def cluster_connection():
        conf_file = "/etc/ceph/ceph.conf"
        keyring = "/etc/ceph/ceph.client.admin.keyring"
        api = rados.Rados(conffile=conf_file, name="client.admin", conf={"keyring": keyring})
        return api

    cluster = cluster_connection()
    cluster.connect()


    """
    timeout = 10
    start = time.time()
    worker_name = "ProcessWorker"
    con1, con2 = multiprocessing.Pipe()

    print "Spawning worker {} with timeout {}".format(worker_name,
                                                      timeout)
    p = Worker(con2)
    p.start()
    p.join(timeout)
    if p.is_alive():
        p.terminate()
        print "Worker {} terminated".format(worker_name)
    else:
        print con1.recv()
    print p.exitcode

    runtime = time.time() - start
    print "Returning from worker {} after {} seconds.".format(worker_name,
                                                              runtime)
    """