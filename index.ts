import { serve } from 'bun';

if (process.env.NODE_ENV === 'development') console.debug(`🚧 Running in debug mode!`);

const stringCleanup = (dirty: string) => dirty.replace(/<\/?[^>]+(>|$)/g, '');

serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    // Extract sessionID from the current URL path
    const url = new URL(req.url);
    const sessionID = url.pathname.split('/')[1];
    if (!sessionID)
      return new Response(
        `No sessionID provided! Example: "${`${url}`.replace(
          'http:',
          'https:'
        )}S-U-h33tology:fitness"`,
        { status: 400 }
      );
    // send API request to Resonite to get lnl-net link
    const sessionDetailsRaw = await fetch(
      `${process.env.RESONITE_API_ENDPOINT}/sessions/${sessionID}`
    );
    const sessionDetails = await sessionDetailsRaw.json();

    // send API request to Resonite to get record details
    let recordDetails = null;
    if (sessionDetails.correspondingWorldId) {
      const recordDetailsRaw = await fetch(
        `${process.env.RESONITE_API_ENDPOINT}/users/${sessionDetails.correspondingWorldId.ownerId}/records/${sessionDetails.correspondingWorldId.recordId}`
      );
      recordDetails = await recordDetailsRaw.json();
    }

    // verify the existence and redirect to steam
    if (sessionDetails.status)
      return new Response(sessionDetails.title, {
        status: sessionDetails.status,
      });
    const lnl = sessionDetails.sessionURLs[0];
    if (!lnl)
      return new Response(`Session "${sessionID}" doesn\'t have a lnl-net link.`, { status: 404 });

    const steamLink = `steam://rungameid/2519830//-Open ${encodeURIComponent(lnl)}`;

    const postData = [
      {
        property: 'twitter:title',
        content: stringCleanup(sessionDetails.name),
      },
      {
        property: 'twitter:image',
        content: `${sessionDetails.thumbnailUrl}`,
      },
      {
        property: 'twitter:card',
        content: 'summary_large_image',
      },
    ];

    if (recordDetails) {
      postData.push(
        ...[
          {
            property: 'og:site_name',
            content: `${recordDetails.ownerName} - ${stringCleanup(recordDetails.name)}`,
          },
          {
            property: 'twitter:description',
            content: recordDetails.description,
          },
        ]
      );
    }

    const heads = postData
      .map(({ property, content }) => `<meta property="${property}" content="${content}" />`)
      .join('\n');

    const htmlRes = `
<html>
  <head>
    ${heads}
  </head>
  <body>
    <script> window.location.href = "${steamLink}" </script>
    <pre>JS disabled! <a href="${steamLink}">Click here to get redirected to Steam.</a></pre>
  </body>
</html>
  `;
    return new Response(htmlRes, {
      status: 200,
      headers: {
        'content-type': 'text/html',
      },
    });
    // return Response.redirect(steamLink);
  },
});
