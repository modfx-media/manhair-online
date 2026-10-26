"use client";

import { useEffect } from "react";

/**
 * Chat and form widgets. They used to start during idle time, which put
 * their scripts on the same connection as the LCP image. Wait until the
 * document has finished loading so the cover can paint first. The widgets
 * still load on every page.
 */
export function DeferredWidgets() {
  useEffect(() => {
    const load = () => {
      const form = document.createElement("script");
      form.src = "https://link.manhaironline.com/js/form_embed.js";
      form.async = true;
      document.body.appendChild(form);

      const chat = document.createElement("script");
      chat.src = "https://widgets.leadconnectorhq.com/loader.js";
      chat.async = true;
      chat.dataset.resourcesUrl = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";
      chat.dataset.widgetId = "6a95e182e48bae5398803e54";
      document.body.appendChild(chat);
    };

    if (document.readyState === "complete") {
      load();
      return;
    }
    window.addEventListener("load", load, { once: true });
    return () => window.removeEventListener("load", load);
  }, []);

  return null;
}
