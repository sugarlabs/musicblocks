Internationalization
====================

We are using PO files as the basic mechanism for managing translation
of Music Blocks. We'd prefer that translators work with the Sugar
Labs [Pootle server](http://translate.sugarlabs.org/projects/MusicBlocks/) and
we will work with you to set up a PO file for your language if one is
not presently on the server. Also feel free to make Pull Requests
directly to this repository with updates to exisiting (or new) PO
files.

Note to newbies
===============

The string of text goes like this:

#: name_of_file(s)_where_the_word_occurs_in_code.js
## put_your_comments_here (after TWO hashes)
msgid "word_in_English"
msgstr "put_word_in_translated_language_here"

The text input between the two quotation marks of msgstr will be displayed when a users browser requests the target language