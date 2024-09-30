import { serve } from "bun";

if (process.env.NODE_ENV === "development")
  console.debug(`🚧 Running in debug mode!`);

serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    // Extract sessionID from the current URL path
    const url = new URL(req.url);
    const sessionID = url.pathname.split("/")[1];
    if (!sessionID) return new Response(`No sessionID provided! Example: "${`${url}`.replace('http:', 'https:')}S-U-h33tology:fitness"`, { status: 400 });
    // send API request to Resonite to get lnl-net link
    const sessionDetailsRaw = await fetch(`${process.env.RESONITE_API_ENDPOINT}/${sessionID}`);
    const sessionDetails = await sessionDetailsRaw.json();

    // verify the existence and redirect to steam
    if (sessionDetails.status) return new Response(sessionDetails.title, { status: sessionDetails.status });
    const lnl = sessionDetails.sessionURLs[0];
    if (!lnl) return new Response(`Session "${sessionID}" doesn\'t have a lnl-net link.`, { status: 404 });
    return Response.redirect(`steam://rungameid/2519830//-Open ${encodeURIComponent(lnl)}`);
  },
});
