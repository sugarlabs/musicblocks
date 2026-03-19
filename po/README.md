Internationalization
====================

We are using PO files as the basic mechanism for managing translation
of Music Blocks. We'd prefer that translators work with the Sugar
Labs [Pootle server]( https://weblate.sugarlabs.org) and
we will work with you to set up a PO file for your language if one is
not presently on the server. Also feel free to make pull requests
directly to this repository with updates to existing (or new) PO
files.

Note to newbies
===============

The string of text goes like this:

#: name_of_file(s)_where_the_word_occurs_in_code.js
## put_your_comments_here (after TWO hashes)
msgid "word_in_English"
msgstr "put_word_in_translated_language_here"

The text input between the two quotation marks of msgstr will be
displayed when a users browser requests the target language.

Under the hood
==============

MusicBlocks.pot is a template that is periodically updated with all of
the strings used for internationalization. Individual language PO
files are updated from this POT file.

As per above, translators work with the PO files, either through the
web interface or by making a pull request.

The localization.ini file is compliled from the PO files. The INI file
is used by JavaScript to do the actual translation of the interface.

There are instructions for adding a new language to the pull-down menu
in the
[README.md](https://github.com/sugarlabs/musicblocks/blob/master/README.md)
file found in the js directory.

The tools for maintaining the POT, PO, and INI files are found in the
[PO Utils](https://github.com/sugarlabs/po-utils) repository.