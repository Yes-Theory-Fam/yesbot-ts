#!/bin/sh
# shellcheck disable=SC2039
if [[ -f databasebackup.sh ]];
 then
        echo backing up bot
        ./databasebackup.sh
fi

echo restarting bot
systemctl restart adrian-yesbot

echo remove old backups
# shellcheck disable=SC2010
ls db-backup | grep yesbot | sort | head -n -4 | xargs rm

echo update succesful
