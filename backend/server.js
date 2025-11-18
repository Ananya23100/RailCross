import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_URL = "https://irctc1.p.rapidapi.com/api/v3/getTrainsByStation";

// Helper to parse "HH:mm" to Date object for today
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );
  return date;
}

app.get("/trains/:stationCode", async (req, res) => {
  const stationCode = req.params.stationCode;

  try {
    const response = await axios.get(API_URL, {
      params: { stationCode: stationCode }, // <-- use camelCase
      headers: {
        "x-rapidapi-host": "irctc1.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    // Add this line to inspect the full response
    console.log("API raw response:", JSON.stringify(response.data, null, 2));

    const trains = response.data?.data?.passing || [];
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    let trainNos = [];

    trains.forEach((train) => {
      const arrival = parseTime(train.arrivalTime);
      const departure = parseTime(train.departureTime);

      if (
        (arrival >= twoHoursAgo && arrival <= now) ||
        (departure >= now && departure <= twoHoursLater)
      ) {
        trainNos.push(train.trainNo);
      }
    });

    // Make trainNos distinct
    trainNos = [...new Set(trainNos)];

    res.json({ stationCode, trainNos });
  } catch (error) {
    console.error("API ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch trains",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
