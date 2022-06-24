#! /bin/sh

/usr/local/bin/yarn db:migrate deploy
/usr/local/bin/yarn start:prod
