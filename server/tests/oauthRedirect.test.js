import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {getSafeClientRedirectUrl} from "../utils/oauthRedirect.js";

test("OAuth destinations use the new domain and preserve development/preview origins", () => {
  const originalClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = "https://www.smartnshine.in";
  try {
    const cases = [
      ["https://www.smartnshine.app/login", "https://www.smartnshine.in"],
      ["https://smartnshine.app", "https://www.smartnshine.in"],
      ["https://interview.smartnshine.app", "https://interview.smartnshine.in"],
      ["https://www.smartnshine.in/login", "https://www.smartnshine.in"],
      ["https://interview.smartnshine.in", "https://interview.smartnshine.in"],
      ["http://localhost:5173/login", "http://localhost:5173"],
      ["http://127.0.0.1:5173", "http://127.0.0.1:5173"],
      ["https://preview.vercel.app", "https://preview.vercel.app"],
      ["https://smartnshine.app.attacker.example", "https://www.smartnshine.in"],
      ["javascript://www.smartnshine.in", "https://www.smartnshine.in"],
      ["%malformed", "https://www.smartnshine.in"],
    ];
    for (const [origin, expected] of cases) {
      assert.equal(getSafeClientRedirectUrl({query: {state: encodeURIComponent(origin)}}), expected);
      assert.equal(getSafeClientRedirectUrl({query: {origin}}), expected);
    }
    process.env.CLIENT_URL = "https://www.smartnshine.app/";
    assert.equal(getSafeClientRedirectUrl({query: {}}), "https://www.smartnshine.in");
    process.env.CLIENT_URL = "invalid";
    assert.equal(getSafeClientRedirectUrl({query: {}}), "https://www.smartnshine.in");
  } finally {
    if (originalClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalClientUrl;
  }
});

test("deployment settings take precedence over local dotenv files", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import ${JSON.stringify(new URL("../config/environment.js", import.meta.url).href)};
    import assert from "node:assert/strict";
    assert.equal(process.env.CLIENT_URL, "https://www.smartnshine.in");
    assert.equal(process.env.SERVER_URL, "https://api.smartnshine.in");
    assert.equal(process.env.NODE_ENV, "production");
  `], {
    env: {
      ...process.env,
      CLIENT_URL: "https://www.smartnshine.in",
      SERVER_URL: "https://api.smartnshine.in",
      NODE_ENV: "production",
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});
