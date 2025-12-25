// Copy text to clipboard utility
export async function copyToClipboard(text: string) {
  if (navigator?.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  } else {
    // fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
import { type ClassValue } from "clsx";
import clsx from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
