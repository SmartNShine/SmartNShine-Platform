import dotenv from "dotenv";
import path from "node:path";
import {fileURLToPath} from "node:url";

const serverDirectory = fileURLToPath(new URL("../", import.meta.url));

// Azure/container settings take priority over local files. Import this module
// before modules that read configuration during their initialization.
dotenv.config({path: path.join(serverDirectory, ".env")});
dotenv.config();
