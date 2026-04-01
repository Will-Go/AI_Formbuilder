"use client";

import createCache from "@emotion/cache";
import type { EmotionCache } from "@emotion/react";
import { CacheProvider } from "@emotion/react";
import type { SerializedStyles } from "@emotion/utils";
import React from "react";
import { useServerInsertedHTML } from "next/navigation";

type Registry = {
  cache: EmotionCache;
  flush: () => string[];
};

export default function EmotionRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [registry] = React.useState<Registry>(() => {
    const cache = createCache({ key: "mui" });
    cache.compat = true;

    let inserted: string[] = [];
    const prevInsert = cache.insert;

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1] as SerializedStyles;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      const style = registry.cache.inserted[name];
      if (typeof style === "string") styles += style;
    }

    return (
      <style
        data-emotion={`${registry.cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}

