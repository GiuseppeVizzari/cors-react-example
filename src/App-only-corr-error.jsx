import { useEffect, useState } from "react";
const apiKey = import.meta.env.REACT_APP_NYT_API_KEY;

if (!apiKey) {
    console.warn('NYT API key is missing! Add VITE_NYT_API_KEY to .env');
}

export default function App() {
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        // NYT Article Search endpoint
        const url = new URL(
            "https://api.nytimes.com/svc/search/v2/articlesearch.json"
        );
        url.searchParams.set("q", "technology"); // a simple query
        url.searchParams.set("api-key", apiKey);

        fetch(url.toString())
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setArticles(data.response.docs))
            .catch((err) => {
                console.error("CORS / fetch error:", err);
                setError(err.message);
            });
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h1>NYT Article Search Demo</h1>
            {error && (
                <pre style={{ color: "red" }}>
          ❌ CORS error: {error}
        </pre>
            )}
            <ul>
                {articles.map((a) => (
                    <li key={a._id}>
                        <a href={a.web_url} target="_blank" rel="noopener noreferrer">
                            {a.headline.main}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
