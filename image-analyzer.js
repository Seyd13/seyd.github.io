// This file contains functions for analyzing images with AI

/* @tweakable number of colors to extract from the image */
window.colorExtractionCount = 5;

/* @tweakable maximum prompt length in characters */
window.maxPromptLength = 500;

/* @tweakable whether to include hex codes in the basic prompt level */
window.includeHexInBasicPrompt = false;

/* @tweakable whether to include hex codes in prompt visualization */
window.visualizeHexCodes = true;

/* @tweakable how to format color names with hex codes in prompts */
window.colorFormatStyle = "name (hex)"; // Options: "name (hex)" or "hex, name" or "name hex"

window.analyzeImageWithAI = async (dataUrl) => {
    // Use AI to analyze the image
    const completion = await websim.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are an expert visual art analyst and prompt engineer for AI image generation systems.
                Analyze the provided image in great detail and create a comprehensive analysis covering:
                1. Medium and style identification
                2. Color palette (describe key colors with precise hex codes)
                3. Composition analysis
                4. Subject matter description
                5. Lighting characteristics
                6. Mood/emotional tone
                7. Technical execution details
                
                Then, craft an optimized text prompt suitable for AI image generators that captures the essence of this image.
                Include hex codes for key colors in the prompt.
                Also provide a negative prompt for elements to avoid.
                
                Respond with JSON only in the following format:
                {
                  "medium": "string", 
                  "style": "string",
                  "colors": [{"name": "string", "hex": "string"}],
                  "composition": "string",
                  "subject": "string",
                  "lighting": "string",
                  "mood": "string",
                  "technique": "string",
                  "keywords": ["string"],
                  "generationPrompt": "string",
                  "negativePrompt": "string"
                }`
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image in detail and generate an AI image prompt that would recreate its style" },
                    { type: "image_url", image_url: { url: dataUrl } }
                ]
            }
        ],
        json: true
    });
    
    // Parse the JSON response
    return JSON.parse(completion.content);
};