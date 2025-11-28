// Cloudflare Worker CORS Proxy for NewsAPI
// Deploy this to Cloudflare Workers to bypass NewsAPI's localhost-only restriction

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        try {
            // Parse the incoming request URL
            const url = new URL(request.url);

            // Get parameters from the query string
            const targetUrl = url.searchParams.get("url");
            const country = url.searchParams.get("country");
            const apiKey = url.searchParams.get("apiKey");

            // Validate required parameters
            if (!targetUrl || !apiKey) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required parameters: url and apiKey"
                    }),
                    {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                    }
                );
            }

            // Build the NewsAPI request URL
            const newsApiUrl = new URL(targetUrl);
            newsApiUrl.searchParams.set("apiKey", apiKey);
            if (country) {
                newsApiUrl.searchParams.set("country", country);
            }

            console.log("Proxying request to:", newsApiUrl.toString());

            // Make the request to NewsAPI
            const response = await fetch(newsApiUrl.toString(), {
                method: "GET",
                headers: {
                    "User-Agent": "Cloudflare-Worker-Proxy/1.0",
                },
            });

            // Get the response data
            const data = await response.json();

            // Return the response with CORS headers
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });

        } catch (error) {
            console.error("Proxy error:", error);

            return new Response(
                JSON.stringify({
                    error: "Proxy error",
                    message: error.message
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }
    },
};
