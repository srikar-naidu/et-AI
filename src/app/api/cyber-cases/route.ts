import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

// Define the types for the CSV data
export type CyberCase = {
  Year: number;
  Day: number;
  Amount_Lost_INR: number;
  Incident_Type: string;
  City: string;
  Category: string;
};

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), "data", "processed", "geospatial", "cybersecurity_cases_india_combined.csv");
    const csvContent = await fs.readFile(csvPath, "utf8");

    const parseResult = Papa.parse<CyberCase>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parse errors:", parseResult.errors);
      return NextResponse.json({ error: "Failed to parse CSV file" }, { status: 500 });
    }

    // Filter to make sure the data is valid
    const validCases = parseResult.data.filter(
      (item) =>
        item.Year &&
        item.Incident_Type &&
        item.City &&
        item.Category &&
        item.Amount_Lost_INR !== undefined
    );

    return NextResponse.json({ cases: validCases });
  } catch (error) {
    console.error("Failed to read cyber cases CSV:", error);
    return NextResponse.json({ error: "Failed to load cyber cases data" }, { status: 500 });
  }
}
