import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@p4p/db";
import { isAllowedRateLimit } from "@p4p/shared";

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce rate limiting
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!isAllowedRateLimit(`scan:${ip}`, 5, 60 * 60 * 1000)) {
      return new NextResponse(
        "Too many scan requests. Please try again in an hour.",
        {
          status: 429,
          headers: { "Retry-After": "3600" },
        },
      );
    }

    const body = await request.json();
    const { textList, fileBase64, fileType, schoolId } = body;

    // 2. Cap upload size (Base64 length should not exceed ~8MB, roughly 6MB binary file)
    if (fileBase64 && fileBase64.length > 8 * 1024 * 1024) {
      return new NextResponse("File size is too large. Cap limit is 5MB.", {
        status: 413,
      });
    }

    // 3. Load active database products catalog for matching context
    const products = await prisma.product.findMany();
    const catalogBrief = products.map((p: any) => ({
      id: p.id,
      name: p.itemName,
      brand: p.brand || "N/A",
      sku: p.sku,
      price: p.unitPrice.toNumber(),
      category: p.category,
    }));

    const systemPrompt = `
      You are Preppi, the helpful stationery assistant for Prepped 4 Prep.
      Your task is to parse a school stationery list (which may be a photo, pasted text, or document content) and match it to our product catalog.

      Our active catalog is as follows:
      ${JSON.stringify(catalogBrief, null, 2)}

      Match each item on the parent's list to exactly one product in our catalog if a close match exists.
      If no close match exists, set the productId to null.

      For each matched product:
      1. Check if there is a cheaper alternative product in the catalog (e.g. generic brand vs premium brand, same item category). If so, add a substitution suggestion.
      2. Check if there is an exercise book or textbook in the list. If yes, suggest our "Book Covering" service (Product ID where category is "Service" and name contains "Covering"). If there is any item requiring labels, suggest our "Labeling" service.

      You MUST respond with a single, valid JSON object containing exactly this structure, with no markdown styling, backticks, or explanation:
      {
        "parsedItems": [
          {
            "scannedText": "original scanned text representing this item",
            "productId": "string or null",
            "quantity": 1,
            "confidence": "high" | "medium" | "low",
            "note": "brief explanation of match"
          }
        ],
        "substitutions": [
          {
            "originalProductId": "string",
            "cheaperProductId": "string",
            "priceSaving": 5.50,
            "note": "e.g. Save R5.50 by choosing the generic ruler"
          }
        ],
        "upsells": [
          {
            "serviceProductId": "string",
            "note": "e.g. Add Book Covering for your 5 exercise books for R10.00"
          }
        ]
      }
    `;

    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    const geminiKey = process.env.GEMINI_API_KEY || "";

    // ---------------- FALLBACK MOCK PARSING GENERATOR ----------------
    if (
      (!apiKey || apiKey === "re_placeholder") &&
      (!geminiKey || geminiKey === "re_placeholder")
    ) {
      console.log(
        "[AI Import Scanner] No API keys configured. Running smart matching simulator fallback.",
      );

      // Perform simple text pattern matching to make the demo feel alive
      const rawText = (textList || "").toLowerCase();

      // Let's filter catalog products
      const parsedItems: any[] = [];
      const substitutions: any[] = [];
      const upsells: any[] = [];

      // Find products in our seeded catalog by name keyword
      const findProductByKeyword = (kw: string) => {
        return catalogBrief.find(
          (p: any) =>
            p.name.toLowerCase().includes(kw) && p.category === "Stationery",
        );
      };

      const ruler = findProductByKeyword("ruler");
      const pencil =
        findProductByKeyword("pencil") || findProductByKeyword("hb");
      const book =
        findProductByKeyword("book") || findProductByKeyword("exercise");
      const cover =
        findProductByKeyword("cover") || findProductByKeyword("sleeve");

      // We can also find generic cheaper options if available
      const genericPencil = catalogBrief.find(
        (p: any) =>
          p.name.toLowerCase().includes("pencil") &&
          p.brand?.toLowerCase().includes("generic"),
      );
      const brandedPencil = catalogBrief.find(
        (p: any) =>
          p.name.toLowerCase().includes("pencil") &&
          p.brand &&
          !p.brand.toLowerCase().includes("generic"),
      );

      // If user pasted custom keywords, map them. Otherwise map general checklist
      if (rawText.length > 5) {
        if (rawText.includes("ruler") && ruler) {
          parsedItems.push({
            scannedText: "Ruler / 30cm Ruler",
            productId: ruler.id,
            quantity: 1,
            confidence: "high",
            note: `Matched to "${ruler.name}"`,
          });
        }
        if (rawText.includes("pencil") && pencil) {
          parsedItems.push({
            scannedText: "Pencil HB",
            productId: pencil.id,
            quantity: 2,
            confidence: "high",
            note: `Matched to "${pencil.name}"`,
          });
        }
        if (rawText.includes("book") && book) {
          parsedItems.push({
            scannedText: "A4 Exercise Book",
            productId: book.id,
            quantity: 4,
            confidence: "high",
            note: `Matched to "${book.name}"`,
          });
        }
      }

      // Default mock if no matching keywords found to ensure the page always returns a valid, testable manifest!
      if (parsedItems.length === 0) {
        // Just take the first 3 stationery items in the catalog
        const items = catalogBrief
          .filter((p: any) => p.category === "Stationery")
          .slice(0, 3);
        items.forEach((item, idx) => {
          parsedItems.push({
            scannedText: `${idx + 1}. Required Stationery ${item.name}`,
            productId: item.id,
            quantity: idx === 1 ? 2 : 1,
            confidence: "high",
            note: `Matched to "${item.name}"`,
          });
        });
      }

      // Add a substitution if we matched a branded pencil and have a generic one
      if (brandedPencil && genericPencil) {
        // Ensure branded is in parsedItems so substitution matches
        if (!parsedItems.some((m) => m.productId === brandedPencil.id)) {
          parsedItems.push({
            scannedText: "HB Writing Pencil",
            productId: brandedPencil.id,
            quantity: 1,
            confidence: "high",
            note: `Matched to premium "${brandedPencil.name}"`,
          });
        }
        substitutions.push({
          originalProductId: brandedPencil.id,
          cheaperProductId: genericPencil.id,
          priceSaving: brandedPencil.price - genericPencil.price,
          note: `Save R ${(brandedPencil.price - genericPencil.price).toFixed(2)} by switching to generic brand ${genericPencil.name}.`,
        });
      }

      // Add upsell service recommendations (e.g. Book Covering service)
      const bookCoveringService = catalogBrief.find(
        (p: any) =>
          p.category === "Service" && p.name.toLowerCase().includes("covering"),
      );
      const labelingService = catalogBrief.find(
        (p: any) =>
          p.category === "Service" && p.name.toLowerCase().includes("label"),
      );

      if (bookCoveringService) {
        upsells.push({
          serviceProductId: bookCoveringService.id,
          note: `Add ${bookCoveringService.name} (R ${bookCoveringService.price.toFixed(2)}) for exercise books.`,
        });
      }
      if (labelingService) {
        upsells.push({
          serviceProductId: labelingService.id,
          note: `Add ${labelingService.name} (R ${labelingService.price.toFixed(2)}) for custom name tags.`,
        });
      }

      // Wait a tiny bit to simulate AI processing speed
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        parsedItems,
        substitutions,
        upsells,
      });
    }

    // ---------------- REAL GEMINI VISION / TEXT API CALL ----------------
    if (geminiKey && geminiKey !== 're_placeholder') {
      console.log('[AI Import Scanner] Calling Google Gemini API...');
      try {
        let parts: any[] = [
          { text: systemPrompt }
        ];

        if (fileBase64 && fileType) {
          const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: fileType,
              data: cleanBase64,
            },
          });
          parts.push({
            text: 'Analyze this photo/document and extract the stationery items, matching them to the catalog.',
          });
        } else {
          parts.push({
            text: `Please parse this pasted text stationery list:\n\n${textList}`,
          });
        }

        // Use the active gemini-2.5-flash model on the stable v1 API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts }],
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('[AI Import Scanner] Gemini HTTP Error:', errText);
          return new NextResponse(`Gemini API returned error: ${response.statusText}`, { status: response.status });
        }

        const data = await response.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        // Defensive cleaning of markdown code block wrappers (e.g. ```json ... ```)
        let cleanedText = geminiText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }
        
        const parsedJson = JSON.parse(cleanedText);
        return NextResponse.json(parsedJson);
      } catch (err: any) {
        console.error('[AI Import Scanner] Gemini API invocation error:', err);
        return new NextResponse(`Gemini API processing failed: ${err.message || err}`, { status: 500 });
      }
    }

    // ---------------- REAL CLAUDE VISION API CALL ----------------
    console.log("[AI Import Scanner] Calling Anthropic API...");

    let userContent: any[] = [];
    if (fileBase64 && fileType) {
      // vision block
      const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, "");
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: fileType,
          data: cleanBase64,
        },
      });
      userContent.push({
        type: "text",
        text: "Analyze this photo/document and extract the stationery items, matching them to the catalog.",
      });
    } else {
      // text block
      userContent.push({
        type: "text",
        text: `Please parse this pasted text stationery list:\n\n${textList}`,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI Import Scanner] Anthropic HTTP Error:", errText);
      return new NextResponse(
        `Claude API returned error: ${response.statusText}`,
        { status: response.status },
      );
    }

    const data = await response.json();
    const claudeText = data.content?.[0]?.text || "{}";

    // Parse Claude text as JSON directly
    const parsedJson = JSON.parse(claudeText.trim());

    return NextResponse.json(parsedJson);
  } catch (error: any) {
    console.error("[AI Import Scanner Exception]:", error);
    return new NextResponse(
      `AI Scanner Server Error: ${error?.message || error}`,
      { status: 500 },
    );
  }
}
