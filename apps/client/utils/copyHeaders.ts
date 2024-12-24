import { copyFileSync } from "fs";

copyFileSync(`./private/_headers.${process.env.NODE_ENV ?? "production"}`, "static/_headers");
