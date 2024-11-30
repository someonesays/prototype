import { copyFileSync } from "fs";

if (!process.env.NODE_ENV) throw new Error("Missing NODE_ENV value");
copyFileSync(`./private/_headers.${process.env.NODE_ENV}`, "static/_headers");
