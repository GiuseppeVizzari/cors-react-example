// Cloudflare Worker CORS Proxy for NewsAPI - EDUCATIONAL VERSION
// ============================================================================================
// WHAT IS THIS?
// This is a "Cloudflare Worker" - a serverless function that runs on Cloudflare's edge network.
// It acts as a middleman (proxy) between your browser (React app) and NewsAPI.
//
// WHY DO WE NEED IT?
// 1. CORS: Browsers block requests to APIs that don't explicitly allow your website.
//    This worker adds the necessary "Access-Control-Allow-Origin" headers to fix that.
// 2. Hiding Secrets: In a real app, you'd hide your API key here instead of in the frontend.
// 3. Bypassing Restrictions: NewsAPI's free tier blocks requests from browsers (except localhost).
//    This worker strips browser headers so NewsAPI thinks the request is coming from a server.
// ============================================================================================

export default {
    /**
     * The main entry point for the Worker.
     * Cloudflare calls this function every time a request hits your worker URL.
     *
     * @param {Request} request - The incoming HTTP request from the browser.
     * @param {Object} env - Environment variables (where you'd store secrets like API keys).
     * @param {Object} ctx - Context for background tasks (not used here).
     * @returns {Promise<Response>} - The HTTP response to send back to the browser.
     */
    async fetch(request, env, ctx) {

        // --- 1. HANDLE CORS PREFLIGHT REQUESTS ---
        // Browsers send a special "OPTIONS" request first to check if they are allowed to connect.
        // We must respond with "Yes, you are allowed" (200 OK) and the correct headers.
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    // Allow ANY origin to connect (for development). In production, you might restrict this.
                    "Access-Control-Allow-Origin": "*",
                    // Allow these HTTP methods
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    // Allow these headers
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        try {
            // --- 2. PARSE THE INCOMING REQUEST ---
            // Convert the request URL string into a URL object so we can easily read query parameters.
            // Example URL: https://worker.dev/?url=https://api.com&apiKey=123
            const url = new URL(request.url);

            // Extract the parameters we need to forward
            const targetUrl = url.searchParams.get("url");     // The actual API we want to call
            const country = url.searchParams.get("country");   // Optional filter
            const apiKey = url.searchParams.get("apiKey");     // The API key

            // --- 3. VALIDATION ---
            // If we don't have a URL or API key, stop here and tell the user.
            if (!targetUrl || !apiKey) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required parameters: url and apiKey"
                    }),
                    {
                        status: 400, // Bad Request
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*", // Always include CORS headers!
                        },
                    }
                );
            }

            // --- 4. PREPARE THE UPSTREAM REQUEST ---
            // Construct the URL for the actual NewsAPI call
            const newsApiUrl = new URL(targetUrl);
            newsApiUrl.searchParams.set("apiKey", apiKey);
            if (country) {
                newsApiUrl.searchParams.set("country", country);
            }

            console.log("Proxying request to:", newsApiUrl.toString());

            // --- 5. MAKE THE REQUEST (THE PROXY PART) ---
            // This is where we call NewsAPI on behalf of the browser.
            // CRITICAL: We customize the headers to fix the HTTP 426 error.
            const response = await fetch(newsApiUrl.toString(), {
                method: "GET",
                headers: {
                    // Set a fake User-Agent so we look like a server/app, not a browser
                    "User-Agent": "Cloudflare-Worker-Proxy/1.0",

                    // --- THE FIX FOR HTTP 426 ---
                    // NewsAPI checks 'Origin' and 'Referer' to detect browser requests.
                    // By setting them to empty strings, we remove them.
                    // This tricks NewsAPI into thinking this is a server-to-server call.
                    "Origin": "",
                    "Referer": "",

                    "Accept": "application/json"
                },
            });

            // --- 6. HANDLE THE RESPONSE ---

            // Check if NewsAPI returned an error (like 401 Unauthorized or 429 Too Many Requests)
            if (!response.ok) {
                console.error("NewsAPI Error Status:", response.status);

                // Try to read the error message text
                const text = await response.text();

                // Try to parse it as JSON to return a clean error object
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
                    // If it wasn't JSON, just return the raw text
                    return new Response(JSON.stringify({ error: "Upstream Error", details: text }), {
                        status: response.status,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        }
                    });
                }
            }

            // If the request was successful, get the JSON data
            const data = await response.json();

            // --- 7. SEND DATA BACK TO BROWSER ---
            // Return the data to your React app.
            // IMPORTANT: We must attach the CORS headers again, or the browser will block the response.
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
            // --- 8. ERROR HANDLING ---
            // If anything crashes (like a network error), catch it here.
            console.error("Proxy error:", error);

            return new Response(
                JSON.stringify({
                    error: "Proxy error",
                    message: error.message
                }),
                {
                    status: 500, // Internal Server Error
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }
    },
};
