#!/usr/bin/env tsx
import { syncAllPodcastFeeds } from "@/lib/media/sync-podcast";

async function main() {
  const results = await syncAllPodcastFeeds();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
