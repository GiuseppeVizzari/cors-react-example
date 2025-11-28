// Cloudflare Worker CORS Proxy for NewsAPI - FIXED VERSION
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
            // CRITICAL FIX: Explicitly set headers to avoid forwarding browser headers
            const response = await fetch(newsApiUrl.toString(), {
                method: "GET",
                headers: {
                    // Use a server-like User-Agent
                    "User-Agent": "Cloudflare-Worker-Proxy/1.0",
                    // Strip Origin and Referer to prevent NewsAPI from detecting browser source
                    "Origin": "",
                    "Referer": "",
                    "Accept": "application/json"
                },
            });

            // Get the response data
            // Note: If NewsAPI returns 426, it might be HTML, so we check status first
            if (!response.ok) {
                console.error("NewsAPI Error Status:", response.status);
                // Try to read text if JSON fails
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    return new Response(JSON.stringify(json), {
                        status: response.status,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        }
                    });
                } catch (e) {
                    // Return text error
                    return new Response(JSON.stringify({ error: "Upstream Error", details: text }), {
                        status: response.status,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        }
                    });
                }
            }

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
