import { Globe } from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import {
  SiBehance,
  SiCodechef,
  SiCodeforces,
  SiCodepen,
  SiDevdotto,
  SiDribbble,
  SiGeeksforgeeks,
  SiGithub,
  SiGitlab,
  SiHackerearth,
  SiHackerrank,
  SiHashnode,
  SiInstagram,
  SiKaggle,
  SiLeetcode,
  SiMedium,
  SiStackoverflow,
  SiX,
  SiYoutube,
} from "react-icons/si";

const platforms = [
  ["leetcode.com", "LeetCode", SiLeetcode],
  ["leetcode.cn", "LeetCode", SiLeetcode],
  ["hackerrank.com", "HackerRank", SiHackerrank],
  ["hackerearth.com", "HackerEarth", SiHackerearth],
  ["codeforces.com", "Codeforces", SiCodeforces],
  ["codechef.com", "CodeChef", SiCodechef],
  ["geeksforgeeks.org", "GeeksforGeeks", SiGeeksforgeeks],
  ["kaggle.com", "Kaggle", SiKaggle],
  ["github.com", "GitHub", SiGithub],
  ["gitlab.com", "GitLab", SiGitlab],
  ["linkedin.com", "LinkedIn", FaLinkedin],
  ["stackoverflow.com", "Stack Overflow", SiStackoverflow],
  ["codepen.io", "CodePen", SiCodepen],
  ["dev.to", "DEV", SiDevdotto],
  ["hashnode.dev", "Hashnode", SiHashnode],
  ["hashnode.com", "Hashnode", SiHashnode],
  ["medium.com", "Medium", SiMedium],
  ["behance.net", "Behance", SiBehance],
  ["dribbble.com", "Dribbble", SiDribbble],
  ["instagram.com", "Instagram", SiInstagram],
  ["x.com", "X", SiX],
  ["twitter.com", "X", SiX],
  ["youtube.com", "YouTube", SiYoutube],
  ["youtu.be", "YouTube", SiYoutube],
];

export function getResumeSocialLink(value) {
  if (typeof value !== "string") return null;

  const address = value.trim();
  if (!address || /[\s\\]/.test(address) || address.startsWith("/")) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(address) ? address : `https://${address}`);
  } catch {
    return null;
  }

  if (!url.hostname.includes(".") || url.username || url.password) return null;

  const hostname = url.hostname.replace(/\.$/, "");
  const platform = platforms.find(
    ([domain]) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  return {
    href: url.href,
    label: platform?.[1] || hostname.replace(/^www\./, ""),
    icon: platform?.[2] || Globe,
  };
}

export function getResumeSocialLinks(contact) {
  if (!Array.isArray(contact?.socialLinks)) return [];

  const links = new Map();
  for (const value of contact.socialLinks) {
    const link = getResumeSocialLink(value);
    if (link) links.set(link.href, link);
  }
  return [...links.values()];
}
