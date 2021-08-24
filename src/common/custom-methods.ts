import axios from "axios";

export const getFirstColumnFromGoogleSheet = async (
  sheetId: string
): Promise<string[]> => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

  const response = await axios.get(url);
  const data = await response.data;
  const rows = data.values;

  return rows.flatMap((row: string[]) => row);
};
