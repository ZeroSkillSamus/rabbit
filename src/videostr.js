import axios from "axios";
import crypto from "crypto";
import { URL, URLSearchParams } from "url";
import * as querystring from "querystring";

class Colors {
  static okgreen = "\x1b[92m";
  static warning = "\x1b[93m";
  static okcyan = "\x1b[96m";
  static fail = "\x1b[91m";
  static endc = "\x1b[0m";
}

const user_agent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";
const key_url =
  "https://raw.githubusercontent.com/yogesh-hacker/MegacloudKeys/refs/heads/main/keys.json";
const decode_url =
  "https://script.google.com/macros/s/AKfycbx-yHTwupis_JD0lNzoOnxYcEYeXmJZrg7JeMxYnEZnLBy5V0--UxEvP-y9txHyy1TX9Q/exec";

export async function extract_videostr(embed_url) {
  //   const readline = require("readline").createInterface({
  //     input: process.stdin,
  //     output: process.stdout,
  //   });

  //   const embed_id = await new Promise((resolve) => {
  //     readline.question("Enter embed ID: ", (answer) => {
  //       resolve(answer.trim());
  //       readline.close();
  //     });
  //   });

  //   if (!embed_id) {
  //     console.log(`${Colors.fail}Embed ID required!${Colors.endc}`);
  //     return;
  //   }

  //   const embed_url = `https://videostr.net/embed-1/v3/e-1/${embed_id}`;
  const headers = {
    Accept: "*/*",
    "X-Requested-With": "XMLHttpRequest",
    Referer: embed_url,
    "User-Agent": user_agent,
  };

  try {
    // Step 1: Get embed page to find nonce
    const response = await axios.get(embed_url, { headers });
    const html = response.data;
    const embed_id = embed_url.split("/")[6].split("?")[0];
    // Find nonce in the response
    let nonce = null;
    const regex48 = /\b[a-zA-Z0-9]{48}\b/;
    const regex16x3 =
      /\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b/;

    const match48 = html.match(regex48);
    const match16x3 = html.match(regex16x3);

    if (match16x3 && match16x3.length === 4) {
      nonce = match16x3[1] + match16x3[2] + match16x3[3];
    } else if (match48) {
      nonce = match48[0];
    }

    if (!nonce) {
      console.log(
        `${Colors.fail}Nonce key not found in embed page.${Colors.endc}`
      );
      return {
        headers,
        m3u8_links: otherSources,
        subtitles: result.tracks,
      };
    }

    // Step 2: Get decryption key
    const key_resp = await axios.get(key_url);
    const key = key_resp.data?.vidstr;
    if (!key) {
      console.log(
        `${Colors.fail}Decryption key not found in keys.json.${Colors.endc}`
      );
      return {
        m3u8_links: [],
        subtitles: [],
      };
    }

    // Step 3: Get sources
    const sources_api = `https://videostr.net/embed-1/v3/e-1/getSources?id=${embed_id}&_k=${nonce}`;
    const data = (await axios.get(sources_api, { headers })).data;
    let video_url;
    if (data.encrypted) {
      const encrypted_data = querystring.escape(data.sources);
      const nonce_encoded = querystring.escape(nonce);
      const key_encoded = querystring.escape(key);
      const decode_api_url = `${decode_url}?encrypted_data=${encrypted_data}&nonce=${nonce_encoded}&secret=${key_encoded}`;

      const decode_resp = (await axios.get(decode_api_url, { maxRedirects: 5 }))
        .data;
      const match_file = decode_resp.match(/"file":"(.*?)"/);
      if (!match_file) {
        console.log(
          `${Colors.fail}Failed to extract decrypted video URL.${Colors.endc}`
        );
        return {
          m3u8_links: [],
          subtitles: [],
        };
      }
      video_url = match_file[1];
    } else {
      video_url = data.sources[0].file;
    }

    const parsed = new URL(embed_url);
    const referer = `${parsed.protocol}//${parsed.host}/`;

    let otherSources = await fetch_qualities(video_url);
    let sourceHeaders = {
      referer: referer,
      origin: referer,
    };

    return {
      headers: sourceHeaders,
      m3u8_links: otherSources,
      subtitles: data.tracks,
    };
    // console.log("\n" + "#".repeat(25));
    // console.log(`Captured URL: ${Colors.okgreen}${video_url}${Colors.endc}`);
    // console.log("#".repeat(25));
    // console.log(
    //   `${Colors.warning}Use these headers to access the URL:${Colors.endc}`
    // );
    // console.log(`${Colors.okcyan}Referer:${Colors.endc} ${referer}\n`);
  } catch (error) {
    console.error(`${Colors.fail}Error: ${error.message}${Colors.endc}`);
    return {
      m3u8_links: [],
      subtitles: [],
    };
  }
}

async function fetch_qualities(default_url) {
  let iframeLinks = [];
  console.log(default_url);
  try {
    let response = await axios.get(default_url, {
      headers: {
        Referer: "https://videostr.net/",
        Origin: "https://videostr.net/",
        "User-Agent": user_agent,
      },
    });
    let resolutions = response.data.match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);
    resolutions?.forEach((str) => {
      let quality = `${str.split("\n")[0].split("x")[1]}p`;

      let url = str.split("\n")[1];
      //if (str.split('\n')[1].includes('index')) {
      if (url.includes(".m3u8")) {
        iframeLinks.push({
          is_m3u8: url.includes("m3u8"),
          quality,
          url,
        });
      }
    });

    return iframeLinks;
  } catch (e) {
    console.error(e);
    return iframeLinks;
  }
}
