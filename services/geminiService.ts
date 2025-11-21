import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askBusinessAdvisor = async (
  question: string,
  inventory: Product[],
  recentSales: Sale[]
): Promise<string> => {
  try {
    // Prepare context data
    const inventorySummary = inventory.map(p => 
      `- ${p.name} (${p.category}): Stock ${p.stock}, Prix ${p.price}`
    ).join('\n');
    
    const salesSummary = recentSales.slice(0, 10).map(s => 
      `- Vente le ${s.date}: Total ${s.total}`
    ).join('\n');

    const systemInstruction = `
      Vous êtes un conseiller commercial expert et un gestionnaire de magasin informatique nommé "TechAdvisor".
      
      Contexte du magasin :
      - Nous vendons du matériel informatique, des fournitures de bureau, et des pièces de rechange.
      
      Données actuelles :
      
      INVENTAIRE (Extrait) :
      ${inventorySummary}
      
      VENTES RÉCENTES (Extrait) :
      ${salesSummary}
      
      Règles :
      1. Répondez toujours en Français.
      2. Soyez professionnel, concis et utile.
      3. Utilisez les données fournies pour justifier vos conseils (ex: suggérer de réapprovisionner si le stock est bas).
      4. Si on vous demande de rédiger une description produit, faites-le de manière commerciale.
      5. Si la question ne concerne pas le business, ramenez poliment le sujet au magasin.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Désolé, je n'ai pas pu analyser cette demande.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur est survenue lors de la consultation de l'assistant IA. Vérifiez votre clé API.";
  }
};
