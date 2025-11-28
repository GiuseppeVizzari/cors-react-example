import { useEffect, useState } from "react";
const API_KEY = import.meta.env.VITE_NEWSAPI_KEY

export default function App() {
    const [articles, setArticles] = useState([]);
    const [directCallError, setDirectCallError] = useState(null);
    const [proxyCallError, setProxyCallError] = useState(null);

    useEffect(() => {
        // NewsAPI
        const url = new URL(
            "https://newsapi.org/v2/top-headlines"
        );

        url.searchParams.set("apiKey", API_KEY);
        url.searchParams.set("country", "us");

        fetch(url.toString())
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setArticles(data.articles))
            .catch((err) => {
                console.error("CORS / fetch error in direct call:", err);
                setDirectCallError(err.message);
            });

        const proxyUrl = new URL(
            "https://soft-cake-cb40.giuseppe-vizzari.workers.dev/"
        );

        proxyUrl.searchParams.set("url", "https://newsapi.org/v2/top-headlines");
        proxyUrl.searchParams.set("country", "us");
        proxyUrl.searchParams.set("apiKey", API_KEY);

        console.log(proxyUrl);

        fetch(proxyUrl.toString())
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setArticles(data.articles))
            .catch((err) => {
                console.error("CORS / fetch error in proxy call:", err);
                setProxyCallError(err.message);
            });

    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h1>NYT Article Search Demo</h1>
            {directCallError && (
                <pre style={{ color: "red" }}>
                    ❌ CORS error in direct call: {directCallError}
                </pre>)}
            {proxyCallError && (
                <pre style={{ color: "red" }}>
                    ❌ CORS error in proxy call: {directCallError}
                </pre>)}
            {!directCallError && (
                <pre style={{ color: "red" }}>
                    Data gathered through the direct call!
                </pre>)}
            {!proxyCallError && (
                <pre style={{ color: "red" }}>
                    Data gathered through the proxy call!
                </pre>)}
            <h2>Top Headlines</h2>
            {articles.length === 0 ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {articles.map((article, index) => (
                        <li key={index} style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
                            <h3>{article.title}</h3>
                            <p><strong>Source:</strong> {article.source.name}</p>
                            <p><strong>Author:</strong> {article.author || "N/A"}</p>
                            <p><strong>Date Published:</strong> {new Date(article.publishedAt).toLocaleDateString()}</p>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">Read more</a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
