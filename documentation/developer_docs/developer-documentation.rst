.. _developer_documentation:

Working on the |oA| documentation
=================================

The documentation for |oA| consists of several documents, which are managed in
the subdirectory ``documentation`` of the source code repository:

* :ref:`install_guides_index` (subdirectory ``install_guides``)
* :ref:`gui_docs_index` (subdirectory ``gui_docs``)
* :ref:`developer_docs_index` (subdirectory ``developer_docs``)

The documentation is written in the `reStructuredText markup language
<http://docutils.sourceforge.net/rst.html>`_. We use the `Sphinx documentation
generator <http://sphinx-doc.org/>`_ to build the documentation in HTML and
PDF format, which is available online from http://docs.openattic.org/.

If you would like to work on the documentation, you first need to checkout a
copy of the |oA| source code repository as outlined in chapter
:ref:`developer_setup_howto` (you can skip the steps of installing the
development tools, if you intend to only work on the documentation).

Requirements
------------

The documentation can be edited using your favorite text editor. Many editors
provide built-in support for reStructuredText to ease the task of formatting.

To setup the Sphinx document generator, consult your Linux distribution's
documentation. Most distributions ship with Sphinx included in the base
distribution, so installing the package ``python-sphinx`` using your
distribution's package management tool usually gets you up and running
quickly, at least for creating the HTML documentation. Creating the PDF
documentation is somewhat more involved, as it requires a LateX environment
(e.g. the ``texlive`` distribution) and the ``latexpdf`` utility (usually
included in the ``pdftex`` package).

For previewing the HTML documentation, you need a local web browser, e.g.
Mozilla Firefox or Google Chrome/Chromium. The PDF document can be previewed
using any PDF viewer, e.g. Evince or Adobe Acrobat Reader |reg|.

Documentation Guidelines
------------------------

In order to maintain a common document structure and formatting, please keep
the following recommendation in mind when working on the documentation:

* Use 2 spaces for indendation, not tabs.
* Wrap long lines at 78 characters, if possible.
* Overlong command line examples should be wrapped in a way that still
  supports cutting and pasting them into a command line, e.g. by using a
  backslash ("\\") for breaking up shell commands.

Building the documentation
--------------------------

After you have made your changes to the respective reST text files, you can
perform a build of the HTML documentation by running the following command
from within the ``documentation`` directory::

  $ make html

Take a close look at the build output for any errors or warnings that might
occur. The resulting HTML files can be found in the directory ``_build/html``.
To open the start page of the documentation, open the index page in a web
browser, e.g. as follows::

  $ firefox _build/html/index.html

To build the PDF document, run the following command::

  $ make latexpdf

This build process will take some more time, again make sure to check for any
warnings or errors that might occur. The resulting PDF can be found in the
directory ``_build/latex``. Open it in a PDF viewer, e.g. as follows::

  $ evince _build/latex/openATTIC.pdf

If you are satisfied with the outcome, commit and push your changes.

If you would like to contribute your changes, please make sure to read
:ref:`developer_contribute` for instructions.
