// This file contains functions for generating and adjusting prompts

/* @tweakable number of colors extracted from the image */
window.colorExtractionCount = 5;

/* @tweakable maximum prompt length in characters */
window.maxPromptLength = 500;

/* @tweakable how many colors to include in each detail level */
window.detailLevelColors = {
    basic: 1,
    simple: 2,
    detailed: 3,
    maximum: 5
};

/**
 * Formats a color with its hex code based on the style preference
 * @param {Object} color - Color object with name and hex 
 * @returns {string} Formatted color string
 */
const formatColorWithHex = (color) => {
    if (!color || !color.name || !color.hex) return '';
    
    const format = window.colorFormatStyle || "name (hex)";
    
    switch (format) {
        case "name (hex)":
            return `${color.name} (${color.hex})`;
        case "hex, name":
            return `${color.hex}, ${color.name}`;
        case "name hex":
            return `${color.name} ${color.hex}`;
        default:
            return `${color.name} (${color.hex})`;
    }
};

/**
 * Generates an adjusted prompt based on the analysis and detail level
 * @param {Object} analysis - The analysis data
 * @param {number} level - The detail level (1-4)
 * @returns {string} The adjusted prompt
 */
window.generateAdjustedPrompt = (analysis, level) => {
    if (!analysis) return '';
    
    let adjustedPrompt = '';
    let includeHex = level > 1 || window.includeHexInBasicPrompt;
    let colorCount = 0;
    
    switch (level) {
        case 1: // Basic
            colorCount = window.detailLevelColors.basic;
            // Basic prompt - just medium, style and subject
            if (includeHex && analysis.colors && analysis.colors.length > 0) {
                const colorDesc = analysis.colors.slice(0, colorCount).map(c => 
                    includeHex ? formatColorWithHex(c) : c.name
                ).join(', ');
                adjustedPrompt = `${analysis.subject} in ${analysis.style} style with ${colorDesc}`;
            } else {
                adjustedPrompt = `${analysis.subject} in ${analysis.style} style`;
            }
            break;
            
        case 2: // Simple
            colorCount = window.detailLevelColors.simple;
            // Medium level - add colors and mood
            const colorDesc = analysis.colors.slice(0, colorCount).map(c => 
                formatColorWithHex(c)
            ).join(', ');
            adjustedPrompt = `${analysis.subject} in ${analysis.style} style, with ${colorDesc} colors, ${analysis.mood} mood`;
            break;
            
        case 3: // Detailed - use the original prompt
            // Add hex codes if they're not already included
            if (analysis.generationPrompt.includes('#')) {
                adjustedPrompt = analysis.generationPrompt;
            } else {
                // Try to add color hex codes to the original prompt
                let prompt = analysis.generationPrompt;
                analysis.colors.forEach(color => {
                    // Only replace the color name if it's not already associated with a hex code
                    if (color.name && !prompt.includes(`${color.name} (`)) {
                        prompt = prompt.replace(
                            new RegExp(`\\b${color.name}\\b`, 'gi'), 
                            formatColorWithHex(color)
                        );
                    }
                });
                adjustedPrompt = prompt;
            }
            break;
            
        case 4: // Maximum
            colorCount = window.detailLevelColors.maximum;
            // Maximum detail - add more technical terms and specificity with hex codes
            const fullColorDesc = analysis.colors.slice(0, colorCount).map(c => 
                formatColorWithHex(c)
            ).join(', ');
            const keywords = analysis.keywords.join(', ');
            adjustedPrompt = `${analysis.subject} in ${analysis.style} style, with ${fullColorDesc} color palette. ${analysis.lighting} lighting creating a ${analysis.mood} atmosphere. ${analysis.composition} composition. ${analysis.technique} technique. ${keywords}. Highly detailed, professional quality.`;
            break;
            
        default:
            adjustedPrompt = analysis.generationPrompt;
    }
    
    // Trim if too long
    if (adjustedPrompt.length > window.maxPromptLength) {
        adjustedPrompt = adjustedPrompt.substring(0, window.maxPromptLength - 3) + '...';
    }
    
    return adjustedPrompt;
};