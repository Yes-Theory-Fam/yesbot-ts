#!/bin/sh

# THIS IS JUST A SAMPLE FILE. EDIT THE DATABASE CONFIG FOR PRODUCTION. REMOVE THE SPELLCHECK COMMENTS.

# shellcheck disable=SC1073
# shellcheck disable=SC1072
/usr/bin/pg_dump --dbname=postgresql://<username>:<password>@<host>:<port>/<database> > db-backup/yesbot-$(date --rfc-3339=seconds | tr ' ' 'T').sql
