
import { GoogleGenAI, Type } from "@google/genai";
import { Receipt } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    storeName: {
      type: Type.STRING,
      description: "The name of the store or vendor.",
    },
    transactionDate: {
      type: Type.STRING,
      description: "The date of the transaction in YYYY-MM-DD format.",
    },
    total: {
      type: Type.NUMBER,
      description: "The final total amount of the transaction.",
    },
    items: {
      type: Type.ARRAY,
      description: "A list of items purchased.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the item.",
          },
          quantity: {
            type: Type.INTEGER,
            description: "The quantity of the item purchased.",
          },
          price: {
            type: Type.NUMBER,
            description: "The price of a single unit of the item.",
          },
        },
        required: ["name", "quantity", "price"],
      },
    },
  },
  required: ["storeName", "transactionDate", "total", "items"],
};

export async function parseReceipt(base64Image: string, mimeType: string): Promise<Receipt> {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Analyze the receipt image and extract the store name, transaction date, total amount, and a list of all purchased items including their name, quantity, and price. Please format the date as YYYY-MM-DD.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Basic validation to ensure the data shape matches the Receipt interface
    if (
        typeof parsedData.storeName === 'string' &&
        typeof parsedData.transactionDate === 'string' &&
        typeof parsedData.total === 'number' &&
        Array.isArray(parsedData.items)
    ) {
        return parsedData as Receipt;
    } else {
        throw new Error("Parsed data does not match the expected receipt structure.");
    }

  } catch (error) {
    console.error("Error parsing receipt with Gemini API:", error);
    throw new Error("Failed to analyze the receipt. Please try another image.");
  }
}
   