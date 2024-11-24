import env from "@/env";
import cluster from "node:cluster";

cluster.setupPrimary({
  exec: "src/server.ts",
});

cluster.on("exit", (worker) => {
  console.log(`#${worker.process.pid} The worker died.`);
  createCluster();
});

for (let i = 0; i < env.CLUSTERS; ++i) {
  createCluster();
}

function createCluster() {
  const worker = cluster.fork();
  console.log(`#${worker.process.pid} A worker has spawned.`);
}
