const ImageParameter = require('../models/ImageParameter');
const axios = require('axios');

// MRI sequence recommendations - keep as a fallback
const MRI_RECOMMENDATIONS = {
  'T1-Weighted': {
    tr: { min: 300, max: 800, ideal: 500 },
    te: { min: 10, max: 30, ideal: 20 },
    flipAngle: { ideal: 90 },
    description: 'T1-weighted imaging is useful for anatomical detail and fat-containing structures.'
  },
  'T2-Weighted': {
    tr: { min: 1500, max: 3000, ideal: 2000 },
    te: { min: 70, max: 150, ideal: 90 },
    flipAngle: { ideal: 90 },
    description: 'T2-weighted imaging is excellent for detecting pathology and fluid.'
  },
  'FLAIR': {
    tr: { min: 2000, max: 5000, ideal: 3000 },
    te: { min: 80, max: 140, ideal: 100 },
    description: 'FLAIR is useful for suppressing CSF signal while maintaining T2 contrast.'
  },
  'DWI': {
    tr: { min: 3000, max: 6000, ideal: 4000 },
    te: { min: 70, max: 120, ideal: 90 },
    description: 'Diffusion-weighted imaging is crucial for detecting early ischemic changes.'
  },
  'GRE': {
    tr: { ideal: 1000 },
    te: { ideal: 25 },
    flipAngle: { ideal: 30 },
    description: 'Gradient echo sequences are useful for detecting hemorrhage and calcification.'
  }
};

// Initialize Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Generate a response using Groq API
const generateResponse = async (message, currentParams, imageName, sequenceType) => {
  try {
    // Create a context for the AI based on the current session
    const context = `
You are an MRI assistant helping students with a simulation. 
Current parameters: ${JSON.stringify(currentParams)}
Current image: ${imageName || 'Not selected'}
Current sequence type: ${sequenceType || 'Not selected'}

Keep your answers concise and educational. Focus on:
1. Parameter recommendations for MRI sequences
2. Slice positioning advice
3. Artifact prevention
4. Parameter validation

If recommending sequence parameters, always format your response in bullet points and include these details:
• TR: [value]ms (range: [min]-[max]ms)
• TE: [value]ms (range: [min]-[max]ms)
• Flip Angle: [value]° (if applicable)

For ${sequenceType} sequences, the typical parameters are:
${MRI_RECOMMENDATIONS[sequenceType] ? 
  `TR: ${MRI_RECOMMENDATIONS[sequenceType].tr?.ideal}ms
   TE: ${MRI_RECOMMENDATIONS[sequenceType].te?.ideal}ms
   Flip Angle: ${MRI_RECOMMENDATIONS[sequenceType].flipAngle?.ideal || 'Variable'}°
   ${MRI_RECOMMENDATIONS[sequenceType].description}` : 
  'Information not available for this sequence type.'}
`;

    // Configure the request to Groq API
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "You are a helpful MRI assistant with expert knowledge." },
          { role: "user", content: context + "\n\nUser question: " + message }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the response text from Groq
    const responseText = response.data.choices[0].message.content;
    console.log("Groq response:", responseText);

    // Parse the response to extract suggested parameters if available
    const suggestedParams = extractParametersFromResponse(responseText, sequenceType);

    return {
      response: responseText,
      suggestedParams
    };

  } catch (error) {
    console.error("Error generating content with Groq:", error.response?.data || error.message);
    
    // Try with an alternative model if the first attempt fails
    try {
      console.log("Trying alternative model: mixtral-8x7b...");
      
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: "You are a helpful MRI assistant with expert knowledge." },
            { role: "user", content: "You are an MRI assistant. " + message }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const responseText = response.data.choices[0].message.content;
      console.log("Alternative model response:", responseText);
      
      const suggestedParams = extractParametersFromResponse(responseText, sequenceType);
      
      return {
        response: responseText,
        suggestedParams
      };
    } catch (secondError) {
      console.error("Error with alternative model:", secondError.response?.data || secondError.message);
      // Fall back to the standard response if both Groq API attempts fail
      return getStandardResponse(message, currentParams, sequenceType);
    }
  }
};

// Extract parameter suggestions from the AI response
function extractParametersFromResponse(text, sequenceType) {
  try {
    const suggestedParams = {};
    
    // Try to extract TR value
    const trMatch = text.match(/TR:\s*(\d+)\s*ms/i);
    if (trMatch && trMatch[1]) {
      suggestedParams.tr = parseInt(trMatch[1]);
    }
    
    // Try to extract TE value
    const teMatch = text.match(/TE:\s*(\d+)\s*ms/i);
    if (teMatch && teMatch[1]) {
      suggestedParams.te = parseInt(teMatch[1]);
    }
    
    // Try to extract Flip Angle value
    const flipAngleMatch = text.match(/Flip Angle:\s*(\d+)/i);
    if (flipAngleMatch && flipAngleMatch[1]) {
      suggestedParams.flipAngle = parseInt(flipAngleMatch[1]);
    }
    
    // Return null if we didn't find any parameters to suggest
    return Object.keys(suggestedParams).length > 0 ? suggestedParams : null;
  } catch (error) {
    console.error("Error extracting parameters:", error);
    return null;
  }
}

// Keep the fallback response function
const getStandardResponse = (message, currentParams, sequenceType) => {
  const msg = message.toLowerCase();

  // Parameter recommendations
  if (msg.includes('recommend') || msg.includes('suggestion') || 
      msg.includes('optimal') || msg.includes('parameter') || 
      msg.includes('settings')) {
    const sequence = MRI_RECOMMENDATIONS[sequenceType];
    if (sequence) {
      return {
        response: `For ${sequenceType} sequences, I recommend:\n` +
          `• TR: ${sequence.tr.ideal}ms (range: ${sequence.tr.min}-${sequence.tr.max}ms)\n` +
          `• TE: ${sequence.te.ideal}ms (range: ${sequence.te.min}-${sequence.te.max}ms)\n` +
          `• Flip Angle: ${sequence.flipAngle?.ideal || 'Variable'}°\n\n` +
          `${sequence.description}`,
        suggestedParams: {
          tr: sequence.tr.ideal,
          te: sequence.te.ideal,
          flipAngle: sequence.flipAngle?.ideal
        }
      };
    }
  }

  // Slice positioning advice
  if (msg.includes('slice') || msg.includes('position') || 
      msg.includes('overlay')) {
    return {
      response: "For optimal slice positioning:\n" +
        "1. Center the overlay box on your target anatomy\n" +
        "2. Ensure margins of at least 10% around the region of interest\n" +
        "3. Avoid oblique angles unless specifically required\n" +
        "4. Consider using multiple planes for complete coverage"
    };
  }

  // Artifact prevention
  if (msg.includes('artifact') || msg.includes('quality')) {
    return {
      response: "To minimize artifacts:\n" +
        "1. Use appropriate FOV (too small can cause wrap-around)\n" +
        "2. Maintain adequate slice gap (25-30% of slice thickness)\n" +
        "3. Adjust matrix size based on required resolution\n" +
        "4. Consider breath-holding or gating for motion-sensitive areas"
    };
  }

  // Default response
  return {
    response: "I can help you with:\n" +
      "• Parameter recommendations\n" +
      "• Slice positioning advice\n" +
      "• Artifact prevention\n" +
      "• Parameter validation\n\n" +
      "What specific aspect would you like to know about?"
  };
};

exports.chat = async (req, res) => {
  try {
    const { message, currentParams, imageName, sequenceType } = req.body;
    const response = await generateResponse(message, currentParams, imageName, sequenceType);
    res.json(response);
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
};