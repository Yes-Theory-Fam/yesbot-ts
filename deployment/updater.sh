#!/bin/sh
echo backing up bot

# shellcheck disable=SC2046
pg_dump -h localhost -p 5433 -U yesbot yesbot > db-backup/yesbot-$(date --rfc-3339=seconds | tr ' ' 'T').sql

echo restarting bot
systemctl restart adrian-yesbot
