#!/bin/bash

set -e

if [[ -f databasebackup.sh ]];
 then
	echo backing up bot
	./databasebackup.sh
fi

echo downloading new verison
docker-compose -f /home/adrian/docker-compose.yml pull

echo restarting bot
systemctl restart adrian-yesbot

echo remove old backups
ls db-backup | grep yesbot | sort | head -n -4 | xargs rm || true

echo update succesful
