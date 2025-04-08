const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

// Initialize WebsimSocket
const room = new WebsimSocket();

/* @tweakable dark mode toggle enabled */
const enableDarkModeToggle = false;

/* @tweakable whether to store analyses in local storage */
window.useLocalStorage = true;

/* @tweakable maximum number of locally stored analyses to keep */
window.maxLocallyStoredAnalyses = 20;

/* @tweakable storage key for local analyses */
window.localStorageKey = "user_image_analyses";

// Main App Component
function App() {
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [detailLevel, setDetailLevel] = useState(3);
    const [savedAnalyses, setSavedAnalyses] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    /* @tweakable whether dark mode is enabled by default */
    const [darkMode, setDarkMode] = useState(true);
    const uploadInputRef = useRef(null);
    const [userIdentifier, setUserIdentifier] = useState(null);

    // Generate a persistent user identifier or retrieve from storage
    useEffect(() => {
        const storedId = localStorage.getItem('user_identifier');
        if (storedId) {
            setUserIdentifier(storedId);
        } else {
            const newId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('user_identifier', newId);
            setUserIdentifier(newId);
        }
    }, []);

    // Load saved analyses - either from local storage or database based on settings
    useEffect(() => {
        if (window.useLocalStorage) {
            // Load from local storage
            const loadLocalAnalyses = () => {
                const storedAnalyses = localStorage.getItem(window.localStorageKey);
                if (storedAnalyses) {
                    setSavedAnalyses(JSON.parse(storedAnalyses).reverse());
                }
            };
            
            loadLocalAnalyses();
            
            // Set up storage event listener to update if localStorage changes in another tab
            window.addEventListener('storage', loadLocalAnalyses);
            return () => {
                window.removeEventListener('storage', loadLocalAnalyses);
            };
        } else {
            // Load from database (only user's own analyses)
            if (userIdentifier) {
                room.collection('image_analysis')
                    .filter({ user_identifier: userIdentifier })
                    .subscribe(analyses => {
                        setSavedAnalyses(analyses.reverse());
                    });
            }
        }
    }, [userIdentifier, window.useLocalStorage]);

    // Apply dark mode class to html element
    useEffect(() => {
        document.documentElement.className = darkMode ? 'dark-mode' : 'light-mode';
    }, [darkMode]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a JPEG, PNG, or WebP image.');
            return;
        }
        
        setImage(file);
        setIsLoading(true);
        
        try {
            // Upload the image to get a URL
            const uploadedUrl = await websim.upload(file);
            setImageUrl(uploadedUrl);
            
            // Create a data URL for local preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                analyzeImage(dataUrl, uploadedUrl);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload image. Please try again.');
            setIsLoading(false);
        }
    };

    const saveAnalysisLocally = (analysisData, imageUrl) => {
        const newAnalysis = {
            id: Date.now().toString(),
            imageUrl: imageUrl,
            user_identifier: userIdentifier,
            created_at: new Date().toISOString(),
            ...analysisData
        };
        
        // Get existing analyses or initialize empty array
        const storedAnalyses = localStorage.getItem(window.localStorageKey);
        let analyses = storedAnalyses ? JSON.parse(storedAnalyses) : [];
        
        // Add new analysis at the beginning
        analyses.unshift(newAnalysis);
        
        // Limit number of stored analyses
        if (analyses.length > window.maxLocallyStoredAnalyses) {
            analyses = analyses.slice(0, window.maxLocallyStoredAnalyses);
        }
        
        // Save back to local storage
        localStorage.setItem(window.localStorageKey, JSON.stringify(analyses));
        
        // Update state
        setSavedAnalyses(analyses);
        
        return newAnalysis;
    };

    const analyzeImage = async (dataUrl, uploadedUrl) => {
        try {
            // Use the window-scoped function instead of imported function
            const analysisData = await analyzeImageWithAI(dataUrl);
            
            if (window.useLocalStorage) {
                // Store analysis locally
                const savedAnalysis = saveAnalysisLocally(analysisData, uploadedUrl);
                setAnalysis(savedAnalysis);
            } else {
                // Store analysis in the database with user identifier
                await room.collection('image_analysis').create({
                    imageUrl: uploadedUrl,
                    user_identifier: userIdentifier,
                    ...analysisData
                });
                
                setAnalysis(analysisData);
            }
            
            setPrompt(analysisData.generationPrompt);
            setNegativePrompt(analysisData.negativePrompt);
            
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('Failed to analyze image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectAnalysis = (selectedAnalysis) => {
        setAnalysis(selectedAnalysis);
        setPrompt(selectedAnalysis.generationPrompt);
        setNegativePrompt(selectedAnalysis.negativePrompt);
        setImageUrl(selectedAnalysis.imageUrl);
    };

    const generateImage = async () => {
        if (!prompt) return;
        
        setIsLoading(true);
        try {
            const result = await websim.imageGen({
                prompt: prompt,
                negative_prompt: negativePrompt,
                aspect_ratio: "1:1"
            });
            
            // Store the generated image
            if (window.useLocalStorage) {
                // Just open in new tab, no need to store locally
                window.open(result.url, '_blank');
            } else {
                // Store in database with user identifier
                await room.collection('generated_image').create({
                    sourceImageUrl: imageUrl,
                    generatedImageUrl: result.url,
                    prompt: prompt,
                    negativePrompt: negativePrompt,
                    user_identifier: userIdentifier
                });
                
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(prompt);
        alert('Prompt copied to clipboard!');
    };
    
    const copyNegativePrompt = () => {
        navigator.clipboard.writeText(negativePrompt);
        alert('Negative prompt copied to clipboard!');
    };
    
    const adjustDetailLevel = (level) => {
        setDetailLevel(level);
        
        if (!analysis) return;
        
        // Use the window-scoped function instead of imported function
        const adjustedPrompt = generateAdjustedPrompt(analysis, level);
        setPrompt(adjustedPrompt);
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>AI Image Style Analyzer</h1>
                <p>Upload a reference image to analyze its style and generate optimized text prompts for AI image generators</p>
                {enableDarkModeToggle && (
                    <button 
                        className="button outline" 
                        style={{marginTop: '1rem'}}
                        onClick={() => setDarkMode(!darkMode)}
                    >
                        Toggle {darkMode ? 'Light' : 'Dark'} Mode
                    </button>
                )}
            </div>
            
            <div className="main-content">
                <div className="card">
                    <div className="card-header">
                        <h2>Upload Reference Image</h2>
                    </div>
                    
                    <div 
                        className={`upload-area ${dragActive ? 'active' : ''}`}
                        onClick={() => uploadInputRef.current.click()}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="upload-text">Drag & drop an image here, or click to browse</p>
                        <input 
                            type="file" 
                            className="upload-input" 
                            ref={uploadInputRef} 
                            onChange={(e) => handleFileUpload(e.target.files[0])}
                            accept="image/jpeg,image/png,image/webp"
                        />
                        <button className="upload-btn">Select Image</button>
                    </div>
                    
                    {imageUrl && (
                        <div>
                            <img src={imageUrl} alt="Uploaded" className="image-preview" />
                        </div>
                    )}
                    
                    <div className="card-header">
                        <h2>Previous Analyses</h2>
                    </div>
                    
                    <div className="saved-analyses">
                        {savedAnalyses.map((savedAnalysis) => (
                            <div key={savedAnalysis.id} className="saved-analysis" onClick={() => selectAnalysis(savedAnalysis)}>
                                <div className="saved-analysis-preview">
                                    {savedAnalysis.imageUrl && (
                                        <img 
                                            src={savedAnalysis.imageUrl} 
                                            alt="Saved analysis" 
                                            style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', margin: '8px 0'}} 
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="card">
                    <div className="card-header">
                        <h2>Style Analysis & Prompt Generation</h2>
                    </div>
                    
                    {isLoading ? (
                        <div className="loading-spinner"></div>
                    ) : analysis ? (
                        <>
                            <div className="analysis-section">
                                <h3>Style Classification</h3>
                                <div className="style-tags">
                                    <div className="tag">{analysis.medium}</div>
                                    <div className="tag">{analysis.style}</div>
                                    {analysis.keywords && analysis.keywords.map((keyword, index) => (
                                        <div key={index} className="tag">{keyword}</div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="analysis-section">
                                <h3>Color Palette</h3>
                                <div className="color-palette">
                                    {analysis.colors && analysis.colors.map((color, index) => (
                                        <div 
                                            key={index} 
                                            className="color-swatch" 
                                            style={{backgroundColor: color.hex}}
                                            title={`${color.name} (${color.hex})`}
                                        >
                                            <div className="color-code">{color.hex}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="analysis-section">
                                <h3>Composition & Technique</h3>
                                <p>{analysis.composition}</p>
                                <p>{analysis.technique}</p>
                            </div>
                            
                            <div className="analysis-section">
                                <h3>Subject & Mood</h3>
                                <p><strong>Subject:</strong> {analysis.subject}</p>
                                <p><strong>Lighting:</strong> {analysis.lighting}</p>
                                <p><strong>Mood:</strong> {analysis.mood}</p>
                            </div>
                            
                            <div className="prompt-container">
                                <h3>Generation Prompt</h3>
                                <div className="settings-row">
                                    <div className="settings-label">Detail Level</div>
                                    <div className="settings-control">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="4" 
                                            value={detailLevel} 
                                            onChange={(e) => adjustDetailLevel(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <span>{['Basic', 'Simple', 'Detailed', 'Maximum'][detailLevel-1]}</span>
                                    </div>
                                </div>
                                <textarea 
                                    className="prompt-text" 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                ></textarea>
                                <div className="prompt-controls">
                                    <button className="button" onClick={copyPrompt}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        Copy Prompt
                                    </button>
                                    <button className="button secondary" onClick={generateImage}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                        Generate Image
                                    </button>
                                </div>
                            </div>
                            
                            <div className="prompt-container">
                                <h3>Negative Prompt</h3>
                                <textarea 
                                    className="prompt-text" 
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                ></textarea>
                                <div className="prompt-controls">
                                    <button className="button secondary" onClick={copyNegativePrompt}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        Copy Negative Prompt
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Upload an image to see the analysis and generated prompts.</p>
                            <p>The AI will analyze the visual style, colors, composition, and generate optimized prompts for AI image generators.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="footer">
                <p>AI Image Style Analyzer &copy; {new Date().getFullYear()} - Powered by AI</p>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);