import re
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, quote_plus

class Colors:
    okgreen = '\033[92m'
    warning = '\033[93m'
    okcyan = '\033[96m'
    fail = '\033[91m'
    endc = '\033[0m'

user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
key_url = "https://raw.githubusercontent.com/yogesh-hacker/MegacloudKeys/refs/heads/main/keys.json"
decode_url = "https://script.google.com/macros/s/AKfycbx-yHTwupis_JD0lNzoOnxYcEYeXmJZrg7JeMxYnEZnLBy5V0--UxEvP-y9txHyy1TX9Q/exec"

def main():
    embed_id = input("Enter embed ID: ").strip()
    if not embed_id:
        print(f"{Colors.fail}Embed ID required!{Colors.endc}")
        return

    embed_url = f"https://videostr.net/embed-1/v3/e-1/{embed_id}"
    headers = {
        "Accept": "*/*",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": embed_url,
        "User-Agent": user_agent
    }

    response = requests.get(embed_url, headers=headers).text

    match = re.search(r'\b[a-zA-Z0-9]{48}\b', response) or re.search(r'\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b', response)
    nonce = ''.join(match.groups()) if match and match.lastindex == 3 else match.group() if match else None

    if not nonce:
        print(f"{Colors.fail}Nonce key not found in embed page.{Colors.endc}")
        return

    key_resp = requests.get(key_url).json()
    key = key_resp.get('mega')
    if not key:
        print(f"{Colors.fail}Decryption key not found in keys.json.{Colors.endc}")
        return

    sources_api = f"https://videostr.net/embed-1/v3/e-1/getSources?id={embed_id}&_k={nonce}"
    data = requests.get(sources_api, headers=headers).json()

    if data.get('encrypted'):
        encrypted_data = quote_plus(data['sources'])
        nonce_encoded = quote_plus(nonce)
        key_encoded = quote_plus(key)
        decode_api_url = f"{decode_url}?encrypted_data={encrypted_data}&nonce={nonce_encoded}&secret={key_encoded}"
        print(decode_api_url)
        decode_resp = requests.get(decode_api_url, allow_redirects=True).text
        match_file = re.search(r'"file":"(.*?)"', decode_resp)
        if not match_file:
            print(f"{Colors.fail}Failed to extract decrypted video URL.{Colors.endc}")
            return
        video_url = match_file.group(1)
    else:
        video_url = data['sources'][0]['file']

    parsed = urlparse(embed_url)
    referer = f"{parsed.scheme}://{parsed.netloc}/"

    print("\n" + "#" * 25)
    print(f"Captured URL: {Colors.okgreen}{video_url}{Colors.endc}")
    print("#" * 25)
    print(f"{Colors.warning}Use these headers to access the URL:{Colors.endc}")
    print(f"{Colors.okcyan}Referer:{Colors.endc} {referer}\n")

if __name__ == "__main__":
    main()