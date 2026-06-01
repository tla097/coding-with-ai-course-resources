import urllib.request
import json
import os
from datetime import datetime
from config import YELLOW, CYAN, GREEN, RED, RESET, CATEGORIES

TITLE = f"""{RED}
  _____ _                _      _   _                _
 / ____| |              | |    | \ | |              (_)
| |    | |__  _   _  ___| | __ |  \| | ___  _ __ _ __ _ ___
| |    | '_ \| | | |/ __| |/ / | . ` |/ _ \| '__| '__| / __|
| |____| | | | |_| | (__|   <  | |\  | (_) | |  | | | \__ \\
 \_____|_| |_|\__,_|\___|_|\_\ |_| \_|\___/|_|  |_| |_|___/
{RESET}"""

FAVOURITES_FILE = os.path.join(os.path.dirname(__file__), "favourites.txt")

def fetch_joke():
    url = "https://api.chucknorris.io/jokes/random"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read().decode())
    return data["value"]

def save_joke(joke):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(FAVOURITES_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}]\n{joke}\n\n")
    print(f"{GREEN}Joke saved to favourites.txt!{RESET}")

while True:
    joke = fetch_joke()
    print(f"\n{YELLOW}{joke}{RESET}")
    answer = input(f"\n{CYAN}Another joke? [y]es / [n]o / [s]ave this one: {RESET}").strip().lower()
    if answer in ("s", "save"):
        save_joke(joke)
        answer = input(f"{CYAN}Another joke? [y]es / [n]o: {RESET}").strip().lower()
    if answer not in ("yes", "y"):
        print(f"\n{GREEN}Goodbye!{RESET}")
        break
