
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://bharat-trade-ai-git-main-unique-42ad.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to BharatTrade AI Backend",
        status: "Backend is running",
        demo: true,
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "BharatTrade AI API is working",
    });
});

// Price Shockers API
app.get("/api/price-shockers", async (req, res) => {
    try {
        const apiKey = process.env.INDIAN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "IndianAPI key is missing in backend .env",
            });
        }

        const response = await fetch(
            `https://stock.indianapi.in/price_shockers?_=${Date.now()}`,
            {
                headers: {
                    "x-api-key": apiKey,
                    "Cache-Control": "no-cache",
                },
            }
        );

        if (!response.ok) {
            const errorDetails = await response.text();

            console.error("IndianAPI Status:", response.status);
            console.error("IndianAPI Details:", errorDetails);

            if (response.status === 429) {
                return res.status(200).json({
                    success: true,
                    demo: true,
                    message: "IndianAPI rate limit reached. Showing demo data.",
                    data: {
                        NSE_PriceShocker: [],
                        BSE_PriceShocker: [],
                    },
                });
            }

            return res.status(response.status).json({
                success: false,
                message: "IndianAPI request failed",
            });
        }


        const data = await response.json();

        res.json({
            success: true,
            demo: false,
            data: data,
        });

    } catch (error) {
        console.error("Price Shockers error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch price shockers",
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`BharatTrade AI Backend running on port ${PORT}`);
});
