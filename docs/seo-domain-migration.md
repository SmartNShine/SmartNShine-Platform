# SmartNShine search domain

The preferred public origin is `https://smartnshine.in`.

The static sitemap, backend sitemap, page canonicals, structured data, social
metadata, and public discovery manifests use this origin. Both Vercel configs
permanently redirect the main `.app` domains and `www.smartnshine.in` to the same
path on the preferred origin. Query parameters are preserved by Vercel.

## Release steps

1. Deploy the frontend and backend changes. Set the backend's production
   `CLIENT_URL` to `https://smartnshine.in`. Keep OAuth provider callback URLs on
   the API domain as configured.
2. Ensure the Vercel project serves `smartnshine.in` and `www.smartnshine.in`.
   Check for conflicting domain-level redirects before enabling these rules.
3. Configure `smartnshine.app` and `www.smartnshine.app` at their domain host to
   redirect permanently to `https://smartnshine.in`, preserving paths and query
   parameters. Alternatively, attach both to this Vercel project so its redirect
   rules can run. Repository rules cannot affect a domain served elsewhere.
4. Verify a deep link such as `/templates?template=classic` on every old host
   redirects to the matching `.in` URL. Check that `.in` responds successfully
   and declares itself canonical in its HTML.
5. In Google Search Console, verify the old and new domain properties, submit
   the Change of Address for the old domain, and submit
   `https://smartnshine.in/sitemap.xml`. Request indexing for the homepage and
   important public pages.

Google updates search results after recrawling and processing the move; deploying
these changes does not immediately remove old search results. Keep the old
domain redirects working for at least one year.

Reference: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
