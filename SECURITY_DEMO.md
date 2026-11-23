This commit was NOT made by Walter Bender.

It was pushed by a Sugar Labs contributor to demonstrate that git allows
anyone with write access to forge the author name on unsigned commits.
This is exactly how the malware commits appeared to come from maintainers.

Proof: check the GitHub audit log — the token that pushed this commit
belongs to a different person than the name shown.

Action needed: require GPG-signed commits on protected branches.
Unsigned author names are free text and prove nothing.
