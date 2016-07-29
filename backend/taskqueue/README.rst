Task Queue Module
=================

This module is intended to track long running tasks in the background.

Please read this mailing_ first, before continuing.

Hello World
-----------

Let's build our first task:

.. code-block:: Python

    from taskqueue.models import task

    @task
    def hello(name):
        print 'hello {}!'.format(name)


To schedule this task, restart our openattic-systemd and run

.. code-block:: Python

    hello.delay("world")

Now, our daemon should print `hello world!` into the console. Keep in mind that our daemon needs to
import our hello task, thus if you see ``AttributeError: 'module' object has no attribute 'hello'``
in your log file, make the task importable by putting it into a python file.

Recursion
---------

Let's wait for a long running task:

.. code-block:: Python

    @task
    def wait(times):
        if times:
            return wait(times - 1)
        else:
            print 'finished'

This tasks schedules itself similar to a recursive function. As we're using a
`trampoline <https://en.wikipedia.org/wiki/Trampoline_(computing)>`_, we will grow the stack. This
also means that you cannot synchronously wait for a task to finish, thus if you want to run
multiple iterations, you can only use end-recursion. This is similar to
`continuation passing style <https://de.wikipedia.org/wiki/Continuation-passing_style>`_, where
the next task is continuation of our current iteration.

We're JSON serializing the parameters into the database, so you are limited to basic data types,
like int, str, float, list, dict, tuple. As an extension to JSON, you can also use a task as a
parameter. For example, you can use this to chain tasks into one task:

.. code-block:: Python

    from taskqueue.models import deserialize_task
    @task
    def chain(values):
        tasks = map(deserialize_task, values) # need to manually deserialize the tasks
        first, *rest = tasks
        res = first.run_once()
        if isinstance(res, Task):
            return chain([res] + rest, total_count)
        elif not rest:
            return res
        else:
            # Ignoring res here.
            return chain(rest, total_count)

    @task
    def wait_and_print(times, name):
        return chain([wait(times), hello(name)])

When calling ``wait_and_print.delay(3, 'Sebastian')``, Task Queue will run a state machine like this:

.. image:: http://g.gravizo.com/g?digraph G {rankdir="LR"; chain1 -> wait1 -> wait2 -> wait3 -> chain2 -> hello;}

A ready-to-use chain task is available by importing ``taskqueue.models.chain``.

Progress Percentage
-------------------

A task also has an attached progress percentage value. I case you have a long running task where a
progress may be usefull to a user, you can provide a ``percent`` argument to ``@task`` like so:

.. code-block:: Python

    @task(percent=lambda total, remaining: 100 * remaining / total)
    def wait(total, remaining):
        if remaining:
            return wait(total, remaining - 1)
        else:
            print 'finished'

The percent parameter will be called with the same parameters as your task.

.. note:: The function is expected not to have any side effects, as it may be called multiple times
   or never.

Background
----------

As the architecture is similar to other `task queues <https://www.fullstackpython.com/task-queues.html>`_,
I've tried to make a task definition similar to the API of
`Celery <http://docs.celeryproject.org/en/latest/getting-started/first-steps-with-celery.html#application>`_.

Task Queue ist also similar to a Haskell package called `Workflow <https://hackage.haskell.org/package/Workflow>`_,
quote:

    Transparent support for interruptable computations. A workflow can be seen as a persistent
    thread that executes a `monadic <https://en.wikipedia.org/wiki/Monad_(functional_programming)>`_
    computation. Therefore, it can be used in very time consuming
    computations such are CPU intensive calculations or procedures that are most of the time
    waiting for the action of a process or an user, that are prone to communication failures,
    timeouts or shutdowns. It also can be used if you like to restart your program at the point
    where the user left it last time. The computation can be restarted at the interrupted
    point thanks to its logged state in permanent storage.

Task Queue stores the computation context between each trampoline call. Workfloa uses some kind of
`continuation monad <http://www.haskellforall.com/2012/12/the-continuation-monad.html>`_ to hide
interruptions between restarts. Task queue uses a similar idea, although in a greatly reduced
variant, as the syntax of Python is not as `expressive <http://www.fh-wedel.de/~si/seminare/ss13/Ausarbeitung/07.Monaden/haskell.html#3>`_
as other Languages, like C#.

You can even think of a task as being a `green thread <https://en.wikipedia.org/wiki/Green_threads>`_,
because you can schedule multiple tasks at once. Each of them will be executed interleaved.

.. _mailing: https://groups.google.com/forum/#!topic/openattic-users/1-MTS9B60rI