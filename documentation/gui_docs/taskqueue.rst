Background-Tasks
================

What is a background task?
--------------------------
A background task is a task of a process that takes time, while you would
normally be waiting on the frontend, for it to already finish. Instead of
waiting in the UI you will be redirected as soon as the task is created.
The task will finish in the background fulfilling it's duty.

Where can I find the running background tasks?
----------------------------------------------
You can watch your current background tasks by one click on "Background-Tasks"
at the top right, to the left of your login name. A dialogue will open and
list the current pending tasks if any.

Are there different types of tasks?
-----------------------------------
There are three categories of tasks - pending, failed and finished tasks.
You can choose them through the tabs, named after the category, in the
background task dialog. The pending tab is always opened when you open up
the dialog.
* Pending task are queued and waiting to run or running.
* Failed tasks are tasks that failed due to there process or because a user
deleted a pending task.
* Finished tasks are task that have successfully processed what they should do.

How can I test it?
------------------
You can. The |oA| API needed to implement the creation of test task which are
doing nothing than counting numbers, in order to test the functionality with
tasks of a predefined running time.

Open up your Javascript console of your browser after your have logged in and
paste the following function in it::

  var createTestTask = function (time) {
    var xhr = new XMLHttpRequest();
    var url = "/openattic/api/taskqueue/test_task";
    xhr.open("post", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var data = JSON.stringify({times: time});
    xhr.send(data);
  }

Now you can create a test task like this::

  createTestTask(<time in seconds>)

The time a task runs is not really the value you pass, the value determines
the calculation rounds the task will do. One round estimates to around one
second at low numbers.

Can I delete them?
------------------
Yes, even pending tasks, but you will be warned if you want that, because
the running process will not be stopped immediately instead all follow up
executions will be canceled and the action taken will not be revoked.
But if you do so, the task will be handled as a failed task.
Failed and finished task can be deleted with out the risk of data corruption.

Do I have to wait for the task to finish?
-----------------------------------------
No, you see the changes more rapidly. For example if you create a ceph pool
the pool will be created and be available in the pool listing, while it's still
building up, so you should't modify it right away.

Which processes create a background task?
-----------------------------------------
At the moment the following operations are running as background tasks:

* Setting the number of PGs in a ceph pool.

* Getting RBD performance data of a cluster.
