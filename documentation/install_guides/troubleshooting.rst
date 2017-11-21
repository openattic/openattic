.. _troubleshooting:

Troubleshooting
===============

In case of errors, the |oA| WebUI will display popup notifications ("Toasties")
that provide a brief explanation of the error that occured. For most errors, the
|oA| backend will raise a "500 - Internal Server Error" HTTP error, writing a
more detailed Python traceback message to the |oA| logfile.

|oA| log files
--------------

The main log file to consult in case of errors is the file
``/var/log/openattic/openattic.log``. This log file is written by the |oA|
Django application and should provide a detailed error message including the
traceback that explains which Python module the error originated in.

Other logfiles worth checking in case of errors include the Apache HTTP server's
error log. Its location depends on the Linux distribution that |oA| has been
installed on - please consult the distribution's documentation for details.
