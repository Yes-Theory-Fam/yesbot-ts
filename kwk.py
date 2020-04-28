#!/usr/local/bin/python3
import json
import subprocess

data = {}

with open("./src/collections/groupManager.json", 'r') as f:
    data = json.load(f)


for group in data:
    print('a', group)
    n = group.get('name', None)
    if n == None:
        n = group.get('name ')
    n = n.replace("'", "''")
    d = group.get('description', None)
    if d == None:
        d = group.get('description ', 'desc')
    d = d.replace("'", "''")
    subprocess.call(['/usr/local/bin/psql', 'yesbot', '-c', f"insert into user_group (name, description) values ('{n}', '{d}')"])

    for member in group.get('members', []):
        group_ids = {
            "HydroHomies": 41,
            "Chess": 42,
            "Costar ": 43,
            "Stretching": 44,
            "Minecraft ": 45,
            "CSGO ": 46,
            "DoYourLanguage ": 47,
            "LeagueEUW": 48,
            "LeagueNA": 49,
            "ValorantEU": 50,
            "Ludo": 51,
        }

        group_id = group_ids[group.get('name')]

        subprocess.call(['/usr/local/bin/psql', 'yesbot', '-c', f"insert into group_member (id) values ('{member}')"])

        subprocess.call(['/usr/local/bin/psql', 'yesbot', '-c', f"insert into user_group_members_group_member (\"userGroupId\", \"groupMemberId\") values ({group_id}, '{member}')"])
