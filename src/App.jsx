import { useState } from 'react';
import './App.css';

const HF_API_URL = "/api/hf/models/stabilityai/stable-diffusion-xl-base-1.0";
const EXAMPLES = [
  "A futuristic city at sunset, cyberpunk style",
  "A cute baby dragon playing with fire",
  "An astronaut riding a horse on Mars",
  "A magical forest with glowing plants"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateImage = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const hfToken = import.meta.env.VITE_HF_TOKEN;
      if (!hfToken) {
        throw new Error("Missing Hugging Face API Token. Please add VITE_HF_TOKEN to your .env file and restart the server.");
      }

      const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${hfToken}`
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to generate image. Please check your API token.";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
            if (errorJson.estimated_time) {
              errorMessage += ` (Model is loading, please wait ~${Math.round(errorJson.estimated_time)}s and try again)`;
            }
          }
        } catch (e) {
          // not json
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      setImageBlob(blob);
      setImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <h1 className="title">AI Image Generator 🎨</h1>
      <p className="subtitle">Turn your imagination into reality with Stable Diffusion XL</p>

      {error && <div className="error-message">{error}</div>}

      <div className="examples-container">
        {EXAMPLES.map((ex, idx) => (
          <span
            key={idx}
            className="example-badge"
            onClick={() => setPrompt(ex)}
          >
            {ex}
          </span>
        ))}
      </div>

      <form onSubmit={generateImage} className="input-container">
        <input
          type="text"
          className="prompt-input"
          placeholder="Describe what you want to see..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />

        <div className="button-group">
          <button
            type="submit"
            className="action-btn generate-btn"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Generating...
              </>
            ) : (
              "Generate Image"
            )}
          </button>

          {imageUrl && (
            <button
              type="button"
              className="action-btn download-btn"
              onClick={handleDownload}
            >
              ⬇ Download
            </button>
          )}
        </div>
      </form>

      <div className="result-container">
        {isLoading ? (
          <div className="placeholder-text">Creating your masterpiece... This might take a few seconds.</div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={prompt} className="generated-image" />
        ) : (
          <div className="placeholder-text">Your generated image will appear here</div>
        )}
      </div>
    </div>
  );
}

export default App;
