import { copyFileSync } from "fs";

if (!process.env.NODE_ENV) throw new Error("Missing NODE_ENV value");

console.log(process.env);

copyFileSync(`./private/_headers.${process.env.NODE_ENV}`, "static/_headers");
