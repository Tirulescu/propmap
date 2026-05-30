"use client";

import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({
  onToken,
  text = "signin_with",
}: {
  onToken: (idToken: string) => void;
  text?: string;
}) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    async function init() {
      await loadScript("https://accounts.google.com/gsi/client");

      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response?.credential) {
            onToken(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      if (btnRef.current) {
        g.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: text as any,
          width: btnRef.current.clientWidth || 280,
        });
      }
    }

    init();
  }, [onToken, text]);

  return <div ref={btnRef} style={{ width: "100%", minHeight: 40 }} />;
}
