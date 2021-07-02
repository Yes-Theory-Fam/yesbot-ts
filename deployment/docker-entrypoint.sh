#! /bin/sh

/usr/local/bin/yarn db:prisma migrate deploy
/usr/local/bin/yarn start:prod
